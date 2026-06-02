import uuid
import logging
from datetime import datetime, timedelta
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from google.cloud import bigquery
from utils.bq_helper import get_last_sender_for_lead
from utils.secret_helper import get_secret
from utils.config import SECRET_ID, GMAIL_SCOPES, PROJECT_ID
from utils.bq_helper import get_lead_by_email, insert_communication_log_v2, update_lead_status, create_pending_approval
from services.websocket_manager import manager

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

bq_client = bigquery.Client(project=PROJECT_ID)
PROCESSED_TABLE = f"{PROJECT_ID}.leads_meta.processed_gmail_messages"


def build_gmail_readonly_service():
    creds_info = get_secret(SECRET_ID)
    creds = Credentials(
        token=creds_info["access_token"],
        refresh_token=creds_info["refresh_token"],
        token_uri=creds_info.get("token_uri", "https://oauth2.googleapis.com/token"),
        client_id=creds_info["client_id"],
        client_secret=creds_info["client_secret"],
        scopes=GMAIL_SCOPES,
    )
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
    return build("gmail", "v1", credentials=creds)


def is_already_processed(message_id: str) -> bool:
    query = f"""
        SELECT message_id FROM `{PROCESSED_TABLE}`
        WHERE message_id = @message_id LIMIT 1
    """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("message_id", "STRING", message_id)
        ]
    )
    try:
        results = list(bq_client.query(query, job_config=job_config).result())
        return len(results) > 0
    except Exception:
        return False


def mark_as_processed(message_id: str, lead_email: str, classification: str):
    row = {
        "message_id": message_id,
        "processed_at": datetime.utcnow().isoformat(),
        "lead_email": lead_email,
        "classification": classification
    }
    try:
        bq_client.insert_rows_json(PROCESSED_TABLE, [row])
    except Exception as e:
        logger.error(f"[GMAIL POLLER] Failed to mark processed: {e}")


# def extract_email_body(payload: dict) -> str:
#     """Extract plain text body from Gmail message payload"""
#     body = ""
#     if "parts" in payload:
#         for part in payload["parts"]:
#             if part.get("mimeType") == "text/plain":
#                 import base64
#                 data = part.get("body", {}).get("data", "")
#                 if data:
#                     body = base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore")
#                     break
#     else:
#         import base64
#         data = payload.get("body", {}).get("data", "")
#         if data:
#             body = base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore")
#     return body.strip()
def extract_email_body(payload: dict) -> str:
    """Extract plain text body from Gmail message payload"""
    body = ""
    if "parts" in payload:
        for part in payload["parts"]:
            if part.get("mimeType") == "text/plain":
                import base64
                data = part.get("body", {}).get("data", "")
                if data:
                    body = base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore")
                    break
    else:
        import base64
        data = payload.get("body", {}).get("data", "")
        if data:
            body = base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore")

    body = body.strip()

    # Strip quoted reply — everything from "On ... wrote:" onwards
    import re
    patterns = [
        r'\nOn .+wrote:.*',
        r'\n>.*',
        r'\n--+\s*Original Message.*',
        r'\nFrom:.*',
    ]
    for pattern in patterns:
        body = re.split(pattern, body, flags=re.DOTALL)[0]

    return body.strip()


def extract_sender_email(headers: list) -> str:
    for header in headers:
        if header["name"].lower() == "from":
            value = header["value"]
            # Extract email from "Name <email>" format
            if "<" in value:
                return value.split("<")[1].replace(">", "").strip()
            return value.strip()
    return ""


async def classify_and_handle_reply(
    message_id: str,
    sender_email: str,
    reply_text: str,
    lead: dict,
    user_id: str
):
    """Classify reply and take appropriate action"""
    from google import genai

    genai_client = genai.Client()

    # Step 1: Classify the reply
    classification_response = genai_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=f"""Classify this email reply into ONE of: POSITIVE, NEUTRAL, NEGATIVE, MEETING_DETAILS

Rules:
- POSITIVE: wants to talk, interested, let's connect, sounds good
- NEUTRAL: maybe later, not now, try next quarter
- NEGATIVE: not interested, remove me, no thanks, unsubscribe
- MEETING_DETAILS: contains specific date/time/duration for a meeting (e.g. "Tuesday 3pm, 30 minutes")

Reply text: "{reply_text}"

Respond with ONLY the classification word."""
    )

    classification = classification_response.text.strip().upper()
    if classification not in ["POSITIVE", "NEUTRAL", "NEGATIVE", "MEETING_DETAILS"]:
        classification = "NEUTRAL"

    logger.info(f"[GMAIL POLLER] Classified {sender_email} → {classification}")

    # Step 2: Log reply in BQ
    insert_communication_log_v2({
    "id": str(uuid.uuid4()),
    "lead_id": lead.get("id"),
    "campaign_id": lead.get("campaign_id"),  # ← ADD THIS
    "user_id": user_id,                       # ← ADD THIS
    "type": "reply",
    "direction": "inbound",
    "status": "success",
    "to_email": sender_email,
    "reply_text": reply_text,
    "reply_classification": classification,
    "reply_confidence": 0.9,
    "summary": f"Auto-classified as {classification}",
    "created_at": datetime.utcnow().isoformat()
})

    # Step 3: Update lead status
    status_map = {
        "POSITIVE": "replied",
        "NEUTRAL": "replied",
        "NEGATIVE": "replied",
        "MEETING_DETAILS": "replied"
    }
    update_lead_status(lead_id=lead.get("id"), status=status_map[classification])   
    from utils.bq_helper import upsert_user_lead_status
    upsert_user_lead_status(
        user_id=user_id,
        lead_id=lead.get("id"),
        status=status_map[classification]
    )
    if lead.get("campaign_id"):
        try:
            from utils.bq_helper import update_campaign_stats
            update_campaign_stats(
                campaign_id=lead.get("campaign_id"),
                field="replies_received",
                increment=1
            )
        except Exception as e:
            logger.warning(f"[GMAIL POLLER] Campaign replies_received update failed: {e}")

    # Step 4: Handle based on classification
    if classification == "POSITIVE":
        await handle_positive_reply(sender_email, lead, user_id, reply_text)

    elif classification == "MEETING_DETAILS":
        await handle_meeting_details_reply(sender_email, lead, user_id, reply_text)

    elif classification == "NEGATIVE":
        create_pending_approval({
            "approval_id": str(uuid.uuid4()),
            "user_id": user_id,
            "campaign_id": None,
            "lead_id": lead.get("id"),
            "lead_name": lead.get("name"),
            "lead_email": sender_email,
            "followup_number": 0,
            "total_followups": 0,
            "email_subject": "REPLY_DISPLAY",
            "email_body": reply_text,
            "scheduled_time": datetime.utcnow().isoformat(),
            "status": "pending",
            "created_at": datetime.utcnow().isoformat()
        })
        await manager.send_to_user(user_id, {
            "type": "reply_received",
            "data": {
                "lead_name": lead.get("name"),
                "lead_email": sender_email,
                "classification": "negative",
                "reply_text": reply_text,
                "reply_date": datetime.utcnow().strftime("%b %d, %Y · %I:%M %p")
            }
        })

    elif classification == "NEUTRAL":
        create_pending_approval({
            "approval_id": str(uuid.uuid4()),
            "user_id": user_id,
            "campaign_id": None,
            "lead_id": lead.get("id"),
            "lead_name": lead.get("name"),
            "lead_email": sender_email,
            "followup_number": 0,
            "total_followups": 0,
            "email_subject": "REPLY_DISPLAY",
            "email_body": reply_text,
            "scheduled_time": datetime.utcnow().isoformat(),
            "status": "pending",
            "created_at": datetime.utcnow().isoformat()
        })
        await manager.send_to_user(user_id, {
            "type": "reply_received",
            "data": {
                "lead_name": lead.get("name"),
                "lead_email": sender_email,
                "classification": "neutral",
                "reply_text": reply_text,
                "reply_date": datetime.utcnow().strftime("%b %d, %Y · %I:%M %p")
            }
        })

async def handle_positive_reply(sender_email: str, lead: dict, user_id: str, reply_text: str):
    from google import genai
    genai_client = genai.Client()

    email_response = genai_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=f"""Generate a short professional email asking this lead for their availability for a meeting.

Lead name: {lead.get('name', '')}
Their reply: "{reply_text}"

The email should:
1. Acknowledge their positive response warmly
2. Ask them to share: preferred date, time, and duration (30 or 60 minutes)
3. Be under 80 words
4. Plain text only, no markdown
5. End with "Best regards," on a new line

Return ONLY the email body, no subject line."""
    )

    email_body = email_response.text.strip()
    subject = "Re: Let's connect — when works for you?"

    # 1. Save reply display notification (lead's actual reply text)
    reply_notif_id = str(uuid.uuid4())
    create_pending_approval({
        "approval_id": reply_notif_id,
        "user_id": user_id,
        "campaign_id": None,
        "lead_id": lead.get("id"),
        "lead_name": lead.get("name"),
        "lead_email": sender_email,
        "followup_number": 0,
        "total_followups": 0,
        "email_subject": "REPLY_DISPLAY",   # ← discriminator flag
        "email_body": reply_text,            # ← lead's actual reply
        "scheduled_time": datetime.utcnow().isoformat(),
        "status": "pending",
        "created_at": datetime.utcnow().isoformat()
    })

    # 2. Save scheduling email draft for approval
    approval_id = str(uuid.uuid4())
    create_pending_approval({
        "approval_id": approval_id,
        "user_id": user_id,
        "campaign_id": None,
        "lead_id": lead.get("id"),
        "lead_name": lead.get("name"),
        "lead_email": sender_email,
        "followup_number": 0,
        "total_followups": 0,
        "email_subject": subject,            # ← LLM drafted subject
        "email_body": email_body,            # ← LLM drafted body
        "scheduled_time": datetime.utcnow().isoformat(),
        "status": "pending",
        "created_at": datetime.utcnow().isoformat()
    })

    # Push WebSocket notification
    await manager.send_to_user(user_id, {
        "type": "reply_received",
        "data": {
            "lead_name": lead.get("name"),
            "lead_email": sender_email,
            "classification": "positive",
            "reply_text": reply_text,
            "reply_date": datetime.utcnow().strftime("%b %d, %Y · %I:%M %p"),
            "approval_id": approval_id
        }
    })

    logger.info(f"[GMAIL POLLER] Positive reply approval created {approval_id}")


async def handle_meeting_details_reply(sender_email: str, lead: dict, user_id: str, reply_text: str):
    from google import genai
    import json as json_module
    from utils.bq_helper import get_user_profile
    profile = get_user_profile(user_id)
    sender_name = profile.get("name", "Outreach AI") if profile else "Outreach AI"
    sender_product = profile.get("product_service", "Discussion") if profile else "Discussion"
    genai_client = genai.Client()

    extraction_response = genai_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=f"""Extract meeting details from this email reply.

Reply: "{reply_text}"
Current date: {datetime.utcnow().strftime("%Y-%m-%d")}

Return ONLY valid JSON (no markdown):
{{
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "duration_minutes": 30,
  "timezone": "Asia/Kolkata"
}}"""
    )

    try:
        raw = extraction_response.text.strip()
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        details = json_module.loads(raw.strip())
    except Exception as e:
        logger.error(f"[GMAIL POLLER] Failed to parse meeting details: {e}")
        return

    start_iso = f"{details['date']}T{details['time']}:00"
    duration = details.get("duration_minutes", 30)
    start_dt = datetime.fromisoformat(start_iso)

    confirmation_body = f"""Dear {lead.get('name', '')},

This email confirms our upcoming meeting.

Title: Meeting with {lead.get('name', '')}
Date & Time: {start_dt.strftime("%B %d, %Y at %I:%M %p")} ({details.get('timezone', 'Asia/Kolkata')})
Duration: {duration} minutes
Meeting Link: Will be generated upon approval

We look forward to speaking with you.

Best regards,
{sender_name}"""

    subject = f"{sender_product[:30]} — {lead.get('company', '')} | Meeting Confirmed ✓"
    
    # Save lead's raw reply text for display in bell
    create_pending_approval({
        "approval_id": str(uuid.uuid4()),
        "user_id": user_id,
        "campaign_id": None,
        "lead_id": lead.get("id"),
        "lead_name": lead.get("name"),
        "lead_email": sender_email,
        "followup_number": 0,
        "total_followups": 0,
        "email_subject": "REPLY_DISPLAY",
        "email_body": reply_text,           # ← lead's actual raw reply
        "scheduled_time": datetime.utcnow().isoformat(),
        "status": "pending",
        "created_at": datetime.utcnow().isoformat()
    })
    # Save meeting details + confirmation email to pending_approvals
    approval_id = str(uuid.uuid4())
    approval = {
        "approval_id": approval_id,
        "user_id": user_id,
        "campaign_id": None,
        "lead_id": lead.get("id"),
        "lead_name": lead.get("name"),
        "lead_email": sender_email,
        "followup_number": 1,
        "total_followups": 1,
        "email_subject": subject,
        "email_body": json_module.dumps({
            "confirmation_body": confirmation_body,
            "meeting_details": details,
            "start_iso": start_iso,
            "duration": duration
        }),
        "scheduled_time": datetime.utcnow().isoformat(),
        "status": "pending",
        "created_at": datetime.utcnow().isoformat()
    }
    create_pending_approval(approval)

    await manager.send_to_user(user_id, {
        "type": "meeting_approval_pending",
        "data": {
            "lead_name": lead.get("name"),
            "lead_email": sender_email,
            "approval_id": approval_id,
            "meeting_date": start_dt.strftime("%B %d, %Y at %I:%M %p"),
            "duration": duration
        }
    })

    logger.info(f"[GMAIL POLLER] Meeting approval created {approval_id}")

async def poll_gmail_replies():
    """Main polling function - runs every 5 minutes via scheduler"""
    logger.info("[GMAIL POLLER] Starting poll cycle")

    from utils.bq_helper import get_all_active_users
    users = get_all_active_users()
    if not users:
        logger.info("[GMAIL POLLER] No active users found")
        return
    for user in users:
        await poll_for_user(user["user_id"])


async def poll_for_user(user_id: str):
    logger.info(f"[GMAIL POLLER] Polling for user: {user_id}")
    try:
        from utils.secret_helper import get_secret
        from utils.config import GMAIL_SCOPES
        from google.oauth2.credentials import Credentials
        from google.auth.transport.requests import Request
        from googleapiclient.discovery import build

        safe_id = user_id.replace("@", "_at_").replace(".", "_")
        creds_data = get_secret(f"gmail_creds_{safe_id}")
        creds = Credentials(
            token=creds_data["access_token"],
            refresh_token=creds_data.get("refresh_token"),
            token_uri=creds_data.get("token_uri", "https://oauth2.googleapis.com/token"),
            client_id=creds_data["client_id"],
            client_secret=creds_data["client_secret"],
            scopes=GMAIL_SCOPES
        )
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
        service = build("gmail", "v1", credentials=creds)
    except Exception as e:
        logger.warning(f"[GMAIL POLLER] Could not build service for {user_id}: {e}")
        return

    try:
        after_time = int((datetime.utcnow() - timedelta(minutes=10)).timestamp())

        results = service.users().messages().list(
            userId="me",
            q=f"in:inbox after:{after_time}",
            maxResults=20
        ).execute()

        messages = results.get("messages", [])
        logger.info(f"[GMAIL POLLER] Found {len(messages)} messages to check for {user_id}")

        for msg_ref in messages:
            message_id = msg_ref["id"]

            if is_already_processed(message_id):
                continue

            full_msg = service.users().messages().get(
                userId="me",
                id=message_id,
                format="full"
            ).execute()

            headers = full_msg.get("payload", {}).get("headers", [])
            sender_email = extract_sender_email(headers)
            reply_text = extract_email_body(full_msg.get("payload", {}))

            if not sender_email or not reply_text:
                continue

            lead = get_lead_by_email(sender_email)
            if not lead:
                logger.info(f"[GMAIL POLLER] Unknown sender {sender_email} — skipping")
                mark_as_processed(message_id, sender_email, "unknown")
                continue

            logger.info(f"[GMAIL POLLER] Processing reply from {sender_email}")

            await classify_and_handle_reply(
                message_id=message_id,
                sender_email=sender_email,
                reply_text=reply_text,
                lead=lead,
                user_id=user_id
            )

            mark_as_processed(message_id, sender_email, "processed")

    except Exception as e:
        logger.exception(f"[GMAIL POLLER ERROR] user={user_id} {e}")