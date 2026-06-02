import asyncio
import json
import logging
import uuid
from utils.bq_helper import insert_communication_log_v2
from datetime import datetime
from typing import Dict, List
from services.websocket_manager import manager
from utils.bq_helper import dismiss_approval
from fastapi import (
    FastAPI,
    HTTPException,
    Request,
    WebSocket,
    WebSocketDisconnect
)
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials


from fastapi.middleware.cors import CORSMiddleware

from dto.models import (
    AgentInput,
    AgentOutput,
    UserProfile,
    LeadSearchRequest,
    LeadSearchResponse,
    LeadResult,
    CampaignCreate,
    CampaignResponse,
    FollowupConfig,
    FollowupRecommendRequest,
    FollowupRecommendResponse,
    PendingApproval,
    ApprovalAction,
    Notification,
    HistoryItem,
    WebSocketMessage
)

from main import call_leads_agent

from utils.bq_helper import (
    save_user_profile,
    get_user_profile,
    search_leads,
    get_lead_by_id,
    create_campaign,
    get_campaigns,
    save_followup_config,
    get_followup_config,
    get_pending_approvals,
    update_approval_status,
    get_notifications,
    get_communication_history,
    update_approval_email
)


import os
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

# -------------------------
# LOGGING
# -------------------------

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# -------------------------
# FASTAPI INIT
# -------------------------

app = FastAPI(
    title="Leads Agent API",
    version="2.0.0"
)

# -------------------------
# CORS
# -------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://your-app.vercel.app",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# -------------------------
# WEBSOCKET MANAGER
# -------------------------

# class WebSocketManager:

#     def __init__(self):
#         self.active_connections: Dict[str, WebSocket] = {}

#     async def connect(
#         self,
#         user_id: str,
#         websocket: WebSocket
#     ):

#         await websocket.accept()

#         self.active_connections[user_id] = websocket

#         logger.info(
#             f"[WS CONNECTED] {user_id}"
#         )

#     def disconnect(
#         self,
#         user_id: str
#     ):

#         self.active_connections.pop(
#             user_id,
#             None
#         )

#         logger.info(
#             f"[WS DISCONNECTED] {user_id}"
#         )

#     async def send_to_user(
#         self,
#         user_id: str,
#         message: dict
#     ):

#         ws = self.active_connections.get(
#             user_id
#         )

#         if ws:

#             await ws.send_json(
#                 message
#             )

# manager = WebSocketManager()

# -------------------------
# HEALTH CHECK
# -------------------------

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/")
async def root():
    return {"message": "Leads Agent Running"}

# ============================================================
# CLASSIFY INTENT
# ============================================================

@app.post("/api/classify-intent")
async def classify_intent(payload: dict):

    try:

        text = payload.get("message", "")

        from google import genai

        genai_client = genai.Client()

        response = genai_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"""Classify this message into exactly ONE word from this list:
find-leads, research, email, meeting, history, followup, reply, default

Rules:
- If user wants to find/search/discover/get/show leads or prospects → find-leads
- If user wants to see previously found leads, earlier list, old leads, all leads found so far → find-leads
- If user wants to research a company or lead → research  
- If user wants to write/send/generate an email → email
- If user wants to book/schedule a meeting → meeting
- If user wants to see past interactions → history
- If user wants to follow up → followup
- If user replied or got a reply → reply
- Everything else → default

Message: "{text}"

Reply with only the single classification word, nothing else."""
        )

        intent = response.text.strip().lower()

        # Validate it returned a known intent
        valid_intents = [
            "find-leads", "research", "email",
            "meeting", "history", "followup",
            "reply", "default"
        ]

        if intent not in valid_intents:
            intent = "default"

        logger.info(
            f"[CLASSIFY INTENT] '{text}' → {intent}"
        )

        return {"intent": intent}

    except Exception as e:

        logger.exception(
            "[CLASSIFY INTENT ERROR]"
        )

        return {"intent": "default"}

from utils.config import GMAIL_SCOPES, CALENDAR_SCOPES
from utils.secret_helper import get_secret

def build_gmail_service_for_user(user_id: str):
    from googleapiclient.discovery import build as google_build
    from google.auth.transport.requests import Request

    safe_id = user_id.replace("@", "_at_").replace(".", "_")
    token_data = get_secret(f"gmail_creds_{safe_id}")
    creds = Credentials(
        token=token_data["access_token"],
        refresh_token=token_data.get("refresh_token"),
        token_uri=token_data.get("token_uri", "https://oauth2.googleapis.com/token"),
        client_id=token_data["client_id"],
        client_secret=token_data["client_secret"],
        scopes=GMAIL_SCOPES
    )
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
    return google_build("gmail", "v1", credentials=creds)


def build_calendar_service_for_user(user_id: str):
    from googleapiclient.discovery import build as google_build
    from google.auth.transport.requests import Request

    safe_id = user_id.replace("@", "_at_").replace(".", "_")
    token_data = get_secret(f"gmail_creds_{safe_id}")
    creds = Credentials(
        token=token_data["access_token"],
        refresh_token=token_data.get("refresh_token"),
        token_uri=token_data.get("token_uri", "https://oauth2.googleapis.com/token"),
        client_id=token_data["client_id"],
        client_secret=token_data["client_secret"],
        scopes=CALENDAR_SCOPES
    )
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
    return google_build("calendar", "v3", credentials=creds)

# ============================================================
# GOOGLE AUTH
# ============================================================
# In-memory flow store to preserve PKCE state
_flow_store: dict = {}
_refined_emails: dict = {}
WEB_CLIENT_SECRET_FILE = "auth/client_secret_621913909275-umpjpki1t26tj2nvlobsgrv1456fa93q.apps.googleusercontent.com.json"
FRONTEND_URL = "http://localhost:5173"
OAUTH_SCOPES = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/calendar",
    "openid",
    "email",
    "profile"
]

@app.get("/api/auth/google")
async def google_auth():
    flow = Flow.from_client_secrets_file(
        WEB_CLIENT_SECRET_FILE,
        scopes=OAUTH_SCOPES,
        redirect_uri="http://localhost:8080/api/auth/callback"
    )
    auth_url, state = flow.authorization_url(
        access_type="offline",
        prompt="consent"
    )
    _flow_store[state] = flow
    return {"auth_url": auth_url}

@app.get("/api/auth/callback")
async def google_auth_callback(code: str, state: str):
    import httpx
    from fastapi.responses import RedirectResponse
    from utils.secret_helper import save_secret

    flow = _flow_store.pop(state, None)
    if not flow:
        raise HTTPException(status_code=400, detail="Invalid or expired OAuth state")

    import os
    os.environ["OAUTHLIB_RELAX_TOKEN_SCOPE"] = "1"
    flow.fetch_token(code=code)
    creds = flow.credentials

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {creds.token}"}
        )
    user_info = resp.json()
    user_email = user_info.get("email")

    creds_data = json.dumps({
        "access_token": creds.token,
        "refresh_token": creds.refresh_token,
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
        "token_uri": creds.token_uri
    })
    safe_email = user_email.replace("@", "_at_").replace(".", "_")
    save_secret(f"gmail_creds_{safe_email}", creds_data)

    return RedirectResponse(
        url=f"{FRONTEND_URL}?user_id={user_email}&access_token={creds.token}&secret_key={safe_email}"
    )
# -------------------------
# EXISTING RUN ENDPOINT
# -------------------------

@app.post("/run", response_model=AgentOutput)
async def run_agent(payload: AgentInput):

    try:

        logger.info(
            f"Received request for user: {payload.user_id}"
        )

        result = await asyncio.wait_for(
            call_leads_agent(
                payload=payload.model_dump(),
                user_id=payload.user_id
            ),
            timeout=600
        )

        return result

    except asyncio.TimeoutError:

        logger.error(
            "Request timed out"
        )

        raise HTTPException(
            status_code=504,
            detail="Request timed out"
        )

    except Exception as e:

        logger.exception(
            "Agent execution failed"
        )

        raise HTTPException(
            status_code=500,
            detail=f"Agent execution failed: {str(e)}"
        )

# ============================================================
# USER PROFILE
# ============================================================

@app.post("/api/profile/save")
async def save_profile(
    profile: UserProfile
):

    try:

        logger.info(
            f"[SAVE PROFILE] {profile.user_id}"
        )

        save_user_profile(
            profile.model_dump()
        )

        return {
            "status": "success",
            "user_id": profile.user_id
        }

    except Exception as e:

        logger.exception(
            "[SAVE PROFILE ERROR]"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@app.get(
    "/api/profile/{user_id}",
    response_model=UserProfile
)
async def get_profile(
    user_id: str
):

    try:

        logger.info(
            f"[GET PROFILE] {user_id}"
        )

        profile = get_user_profile(
            user_id
        )

        if not profile:

            raise HTTPException(
                status_code=404,
                detail="Profile not found"
            )

        return profile

    except HTTPException:
        raise

    except Exception as e:

        logger.exception(
            "[GET PROFILE ERROR]"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# ============================================================
# LEAD SEARCH
# ============================================================

@app.post(
    "/api/leads/search",
    response_model=LeadSearchResponse
)
async def lead_search(
    request: LeadSearchRequest
):

    try:

        logger.info(
            "[LEAD SEARCH]"
        )

        leads = search_leads(
        industries=request.industries,
        job_roles=request.job_roles,
        company_size=request.company_size,
        geography=request.geography,
        limit=request.limit
        )

        from utils.bq_helper import get_user_lead_statuses, save_lead_search
        if leads:
            lead_ids = [l["id"] for l in leads if l.get("id")]
            user_statuses = get_user_lead_statuses(request.user_id, lead_ids)
            for lead in leads:
                lead["lead_status"] = user_statuses.get(lead["id"], "new")
            save_lead_search(
                user_id=request.user_id,
                lead_ids=lead_ids,
                criteria=f"{', '.join(request.industries)} | {', '.join(request.job_roles)}"
            )

        return LeadSearchResponse(
            leads=leads,
            total_count=len(leads),
            criteria=f"{', '.join(request.industries)} | {', '.join(request.job_roles)}"
        )

    except Exception as e:

        logger.exception(
            "[LEAD SEARCH ERROR]"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@app.get(
    "/api/leads/{lead_id}",
    response_model=LeadResult
)
async def get_lead(
    lead_id: str
):

    try:

        logger.info(
            f"[GET LEAD] {lead_id}"
        )

        lead = get_lead_by_id(
            lead_id
        )

        if not lead:

            raise HTTPException(
                status_code=404,
                detail="Lead not found"
            )

        return lead

    except HTTPException:
        raise

    except Exception as e:

        logger.exception(
            "[GET LEAD ERROR]"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# ============================================================
# CAMPAIGNS
# ============================================================

@app.post(
    "/api/campaigns/create",
    response_model=CampaignResponse
)
async def create_campaign_endpoint(
    payload: CampaignCreate
):

    try:

        logger.info(
            f"[CREATE CAMPAIGN] {payload.name}"
        )

        campaign_id = str(
            uuid.uuid4()
        )

        campaign = {
            "campaign_id": campaign_id,
            "user_id": payload.user_id,
            "name": payload.name,
            "target_criteria": json.dumps(payload.target_criteria) if payload.target_criteria else "{}",
            #"lead_ids": payload.lead_ids,
            "status": "active",
            "lead_count": len(payload.lead_ids),
            "emails_sent": 0,
            "replies_received": 0,
            "meetings_booked": 0,
            "completed_steps": 0,
            "created_at": datetime.utcnow().isoformat()
        }

        create_campaign(campaign)

        return {
            "campaign_id": campaign_id,
            "user_id": payload.user_id,
            "name": payload.name,
            "target_criteria": payload.target_criteria or {},
            "status": "active",
            "lead_count": len(payload.lead_ids),
            "emails_sent": 0,
            "replies_received": 0,
            "meetings_booked": 0,
            "completed_steps": 0,
            "created_at": datetime.utcnow().isoformat()
        }

    except Exception as e:

        logger.exception(
            "[CREATE CAMPAIGN ERROR]"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@app.get(
    "/api/campaigns/{user_id}",
    response_model=List[CampaignResponse]
)
async def get_campaigns_endpoint(
    user_id: str
):

    try:

        logger.info(
            f"[GET CAMPAIGNS] {user_id}"
        )

        campaigns = get_campaigns(user_id)
        for c in campaigns:
            if isinstance(c.get("target_criteria"), str):
                try:
                    c["target_criteria"] = json.loads(c["target_criteria"])
                except:
                    c["target_criteria"] = {}
        return campaigns

    except Exception as e:

        logger.exception(
            "[GET CAMPAIGNS ERROR]"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# ============================================================
# FOLLOWUP CONFIG
# ============================================================

@app.post("/api/followup/config/save")
async def save_followup_endpoint(
    config: FollowupConfig
):

    try:

        logger.info(
            "[SAVE FOLLOWUP CONFIG]"
        )

        config_dict = config.model_dump()
        config_dict["config_id"] = config_dict.get("campaign_id") or str(uuid.uuid4())

        save_followup_config(
            config_dict
        )

        return {
            "status": "success",
            "config_id": config_dict["config_id"]
        }

    except Exception as e:

        logger.exception(
            "[SAVE FOLLOWUP ERROR]"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@app.get(
    "/api/followup/config/{campaign_id}",
    response_model=FollowupConfig
)
async def get_followup_endpoint(
    campaign_id: str
):

    try:

        logger.info(
            f"[GET FOLLOWUP CONFIG] {campaign_id}"
        )

        config = get_followup_config(
            campaign_id
        )

        if not config:

            raise HTTPException(
                status_code=404,
                detail="Config not found"
            )

        return config

    except HTTPException:
        raise

    except Exception as e:

        logger.exception(
            "[GET FOLLOWUP ERROR]"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@app.post(
    "/api/followup/recommend",
    response_model=FollowupRecommendResponse
)
async def recommend_followup(
    request: FollowupRecommendRequest
):

    try:

        logger.info(
            f"[FOLLOWUP RECOMMEND] {request.industry}"
        )

        mapping = {
            "Fintech": (2, 5, 12),
            "SaaS": (3, 7, 14),
            "Logistics": (3, 7, 14),
            "HR Tech": (3, 8, 14),
            "Healthcare": (4, 10, 20)
        }
        if not request.industry:
            profile = get_user_profile(request.user_id)
            if profile:
                request.industry = profile.get("target_industry", "SaaS") or "SaaS"

        days = mapping.get(
            request.industry,
            (3, 7, 14)
        )

        return FollowupRecommendResponse(
            followup_1_days=days[0],
            followup_2_days=days[1],
            followup_3_days=days[2],
            rationale=f"Recommended cadence for {request.industry}"
        )

    except Exception as e:

        logger.exception(
            "[FOLLOWUP RECOMMEND ERROR]"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# ============================================================
# BULK OUTREACH WITH AI PERSONALIZATION
# ============================================================

from dto.models import BulkEmailRequest, BulkEmailResponse

@app.post(
    "/api/bulk-outreach",
    response_model=BulkEmailResponse
)
async def bulk_outreach_endpoint(
    request: BulkEmailRequest
):

    try:

        logger.info(
            f"[BULK OUTREACH API] user={request.user_id} leads={len(request.lead_ids)}"
        )

        from tools.tool import generate_personalized_emails, build_gmail_service, format_email_as_html
        from utils.bq_helper import get_lead_by_id, insert_communication_log_v2, update_lead_after_email, update_campaign_stats
        import base64
        from email.mime.text import MIMEText
        from datetime import timedelta

        # Fetch all leads
        all_leads = []
        for lead_id in request.lead_ids:
            lead = get_lead_by_id(lead_id)
            if lead:
                all_leads.append(lead)

        # Get sender profile
        profile = get_user_profile(request.user_id)
        sender_name = profile.get("name", "") if profile else ""
        sender_company = profile.get("company", "") if profile else ""
        sender_product = profile.get("product_service", request.email_body or "") if profile else ""

        # Generate personalized emails in ONE Gemini call
        personalized_emails = await generate_personalized_emails(
            leads=all_leads,
            sender_product=sender_product,
            sender_name=sender_name,
            sender_company=sender_company
        )

        email_map = {
            e["lead_email"]: e
            for e in personalized_emails
        }

        # Send emails
        service = build_gmail_service_for_user(request.user_id)
        sent = 0
        failed = 0
        details = []

        for lead in all_leads:

            try:

                lead_id = lead.get("id")
                lead_email = lead.get("email")
                personalized = email_map.get(lead_email, {})

                body = personalized.get(
                    "body",
                    f"Hi {lead.get('name', '')}, ..."
                )
                subject = personalized.get(
                    "subject",
                    request.email_subject or "Quick intro"
                )

                message = MIMEText(
                    format_email_as_html(body),
                    "html"
                )
                message["to"] = lead_email
                message["subject"] = subject

                raw_message = base64.urlsafe_b64encode(
                    message.as_bytes()
                ).decode()

                sent_msg = (
                    service.users()
                    .messages()
                    .send(userId="me", body={"raw": raw_message})
                    .execute()
                )

                message_id = sent_msg.get("id")

                insert_communication_log_v2({
                    "id": str(uuid.uuid4()),
                    "lead_id": lead_id,
                    "campaign_id": request.campaign_id,
                    "user_id": request.user_id,
                    "type": "email",
                    "direction": "outbound",
                    "status": "success",
                    "to_email": lead_email,
                    "subject": subject,
                    "body": body,
                    "message_id": message_id,
                    "followup_number": 0,
                    "created_at": datetime.utcnow().isoformat()
                })

                next_followup = datetime.utcnow() + timedelta(days=3)

                update_lead_after_email(
                    lead_id=lead_id,
                    campaign_id=request.campaign_id or "",
                    next_followup=next_followup
                )
                from utils.bq_helper import upsert_user_lead_status
                upsert_user_lead_status(
                    user_id=request.user_id,
                    lead_id=lead_id,
                    status="contacted",
                    campaign_id=request.campaign_id or ""
                )
                if request.campaign_id:
                    try:
                        from utils.bq_helper import increment_campaign_lead_count
                        increment_campaign_lead_count(
                            campaign_id=request.campaign_id,
                            lead_id=lead_id
                        )
                    except Exception as e:
                        logger.warning(f"[CAMPAIGN LEAD COUNT] Failed: {e}")

                if request.campaign_id:
                    try:
                        update_campaign_stats(
                            campaign_id=request.campaign_id,
                            field="emails_sent",
                            increment=1
                        )
                    except Exception as stats_err:
                        logger.warning(f"[CAMPAIGN STATS] Skipped due to streaming buffer: {stats_err}")

                sent += 1
                details.append({
                    "lead_id": lead_id,
                    "email": lead_email,
                    "status": "sent",
                    "message_id": message_id
                })

            except Exception as e:

                failed += 1
                details.append({
                    "lead_id": lead.get("id"),
                    "status": "failed",
                    "error": str(e)
                })

        return BulkEmailResponse(
            sent=sent,
            failed=failed,
            details=details
        )

    except Exception as e:

        logger.exception("[BULK OUTREACH API ERROR]")

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# ============================================================
# PENDING APPROVALS
# ============================================================

@app.get(
    "/api/approvals/{user_id}",
    response_model=List[PendingApproval]
)
async def approvals(
    user_id: str
):

    try:

        logger.info(
            f"[GET APPROVALS] {user_id}"
        )

        return get_pending_approvals(
            user_id
        )

    except Exception as e:

        logger.exception(
            "[GET APPROVALS ERROR]"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
@app.post("/api/approvals/bulk/refine")
async def bulk_refine_email(payload: dict):
    try:
        lead_email = payload.get("lead_email")
        instruction = payload.get("instruction", "")
        current_subject = payload.get("current_subject", "")
        current_body = payload.get("current_body", "")

        from google import genai
        genai_client = genai.Client()

        response = genai_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"""Refine this email based on the instruction.

Current email:
Subject: {current_subject}
Body: {current_body}

Instruction: {instruction}

Return ONLY valid JSON (no markdown):
{{"subject": "refined subject", "body": "refined body"}}"""
        )

        import json as json_module
        raw = response.text.strip()
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        result = json_module.loads(raw.strip())

        return {
            "subject": result.get("subject"),
            "body": result.get("body")
        }

    except Exception as e:
        logger.exception("[BULK REFINE ERROR]")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/approvals/{approval_id}/approve")
async def approve(approval_id: str, payload: ApprovalAction):
    try:
        logger.info(f"[APPROVE] {approval_id}")

        # Fetch the approval record
        approvals = get_pending_approvals(payload.user_id)
        approval = next((a for a in approvals if a.get("approval_id") == approval_id), None)

        if approval:
            followup_number = approval.get("followup_number", 0)

            # followup_number=0 → scheduling email, followup_number=1 → meeting confirmation
            if followup_number == 0:
                # Send scheduling email
                from tools.tool import format_email_as_html
                import base64
                from email.mime.text import MIMEText

                # service = build_gmail_service_for_user(payload.user_id)
                # message = MIMEText(
                #     format_email_as_html(approval.get("email_body", "")), "html"
                # )
                # message["to"] = approval.get("lead_email")
                # message["subject"] = approval.get("email_subject")
                refined = _refined_emails.get(approval_id, {})
                email_body = refined.get("email_body") or approval.get("email_body", "")
                email_subject = refined.get("email_subject") or approval.get("email_subject", "")

                service = build_gmail_service_for_user(payload.user_id)
                message = MIMEText(
                    format_email_as_html(email_body), "html"
                )
                message["to"] = approval.get("lead_email")
                message["subject"] = email_subject
                raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
                sent = service.users().messages().send(
                    userId="me", body={"raw": raw}
                ).execute()

                insert_communication_log_v2({
                    "id": str(uuid.uuid4()),
                    "lead_id": approval.get("lead_id"),
                    "user_id": payload.user_id,
                    "type": "email",
                    "direction": "outbound",
                    "status": "success",
                    "to_email": approval.get("lead_email"),
                    "subject": email_subject,
                    "body": email_body,
                    "message_id": sent.get("id"),
                    "created_at": datetime.utcnow().isoformat()
                })
                logger.info(f"[APPROVE] Scheduling email sent to {approval.get('lead_email')}")

            elif followup_number == 1:
                # Book meeting + send confirmation email
                import json as json_module
                from tools.tool import format_email_as_html
                import base64
                from email.mime.text import MIMEText
                from datetime import timedelta

                body_data = json_module.loads(approval.get("email_body", "{}"))
                details = body_data.get("meeting_details", {})
                start_iso = body_data.get("start_iso")
                duration = body_data.get("duration", 30)
                confirmation_body = body_data.get("confirmation_body", "")

                start_dt = datetime.fromisoformat(start_iso)
                end_dt = start_dt + timedelta(minutes=duration)

                calendar_service = build_calendar_service_for_user(payload.user_id)
                event = {
                    "summary": f"Meeting with {approval.get('lead_name')}",
                    "description": "Sales meeting booked via Outreach AI",
                    "start": {"dateTime": start_dt.isoformat(), "timeZone": details.get("timezone", "Asia/Kolkata")},
                    "end": {"dateTime": end_dt.isoformat(), "timeZone": details.get("timezone", "Asia/Kolkata")},
                    "attendees": [{"email": approval.get("lead_email")}],
                    "conferenceData": {
                        "createRequest": {
                            "requestId": f"meet-{uuid.uuid4().hex[:8]}",
                            "conferenceSolutionKey": {"type": "hangoutsMeet"}
                        }
                    }
                }

                created = calendar_service.events().insert(
                    calendarId="primary",
                    body=event,
                    conferenceDataVersion=1
                ).execute()

                meet_link = None
                for ep in created.get("conferenceData", {}).get("entryPoints", []):
                    if ep.get("entryPointType") == "video":
                        meet_link = ep.get("uri")

                # Update confirmation body with real meet link
                confirmation_body = confirmation_body.replace(
                    "Will be generated upon approval",
                    meet_link or "Check your calendar"
                )

                # Send confirmation email
                service = build_gmail_service_for_user(payload.user_id)
                msg = MIMEText(format_email_as_html(confirmation_body), "html")
                msg["to"] = approval.get("lead_email")
                msg["subject"] = "Meeting Confirmed ✓"
                raw_msg = base64.urlsafe_b64encode(msg.as_bytes()).decode()
                service.users().messages().send(
                    userId="me", body={"raw": raw_msg}
                ).execute()

                insert_communication_log_v2({
                    "id": str(uuid.uuid4()),
                    "lead_id": approval.get("lead_id"),
                    "campaign_id": approval.get("campaign_id"),  # ← ADD THIS
                    "user_id": payload.user_id,
                    "type": "meeting",
                    "direction": "outbound",
                    "status": "success",
                    "to_email": approval.get("lead_email"),
                    "summary": f"Meeting with {approval.get('lead_name')}",
                    "start_time": start_dt.isoformat(),
                    "end_time": end_dt.isoformat(),
                    "event_link": meet_link,
                    "created_at": datetime.utcnow().isoformat()
                })

                logger.info(f"[APPROVE] Meeting booked + confirmation sent → {meet_link}")
                if approval.get("campaign_id"):
                    try:
                        from utils.bq_helper import update_campaign_stats, upsert_user_lead_status
                        update_campaign_stats(
                            campaign_id=approval.get("campaign_id"),
                            field="meetings_booked",
                            increment=1
                        )
                    except Exception as e:
                        logger.warning(f"[APPROVE] meetings_booked stat failed: {e}")

                from utils.bq_helper import upsert_user_lead_status
                upsert_user_lead_status(
                    user_id=payload.user_id,
                    lead_id=approval.get("lead_id"),
                    status="closed",
                    campaign_id=approval.get("campaign_id")
                )
        dismiss_approval(approval_id, payload.user_id)
        import threading
        def delayed_status_update():
            import time
            time.sleep(90)
            try:
                update_approval_status(approval_id, "approved")
            except Exception as e:
                logger.warning(f"[APPROVE] Delayed status update failed: {e}")
        threading.Thread(target=delayed_status_update, daemon=True).start()
        return {"status": "success"}

    except Exception as e:
        logger.exception("[APPROVE ERROR]")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/approvals/{approval_id}/refine")
async def refine_email(approval_id: str, payload: dict):
    try:
        user_id = payload.get("user_id")
        instruction = payload.get("instruction", "")

        approvals = get_pending_approvals(user_id)
        approval = next((a for a in approvals if a.get("approval_id") == approval_id), None)

        if not approval:
            raise HTTPException(status_code=404, detail="Approval not found")

        from google import genai
        genai_client = genai.Client()

        response = genai_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"""Refine this email based on the instruction.

Current email:
Subject: {approval.get('email_subject')}
Body: {approval.get('email_body')}

Instruction: {instruction}

Return ONLY valid JSON (no markdown):
{{"subject": "refined subject", "body": "refined body"}}"""
        )

        import json as json_module
        raw = response.text.strip()
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        result = json_module.loads(raw.strip())

        # Update approval in BQ
        # update_approval_email(
        #     approval_id=approval_id,
        #     email_subject=result.get("subject"),
        #     email_body=result.get("body")
        # )
        _refined_emails[approval_id] = {
            "email_subject": result.get("subject"),
            "email_body": result.get("body")
        }

        return {
            "status": "success",
            "email_subject": result.get("subject"),
            "email_body": result.get("body")
        }

    except Exception as e:
        logger.exception("[REFINE EMAIL ERROR]")
        raise HTTPException(status_code=500, detail=str(e))

@app.post(
    "/api/approvals/{approval_id}/skip"
)
async def skip(
    approval_id: str,
    payload: ApprovalAction
):

    try:

        logger.info(
            f"[SKIP] {approval_id}"
        )

        dismiss_approval(approval_id, payload.user_id)
        import threading
        def delayed_skip_update():
            import time
            time.sleep(90)
            try:
                update_approval_status(approval_id, "skipped")
            except Exception as e:
                logger.warning(f"[SKIP] Delayed status update failed: {e}")
        threading.Thread(target=delayed_skip_update, daemon=True).start()

        return {
            "status": "success"
        }

    except Exception as e:

        logger.exception(
            "[SKIP ERROR]"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# ============================================================
# NOTIFICATIONS
# ============================================================

@app.get(
    "/api/notifications/{user_id}",
    response_model=List[Notification]
)
async def notifications(
    user_id: str
):

    try:

        logger.info(
            f"[NOTIFICATIONS] {user_id}"
        )

        # return get_notifications(
        #     user_id
        # )
        notifs = get_notifications(user_id)
        for n in notifs:
            if n.get("notification_id") in _refined_emails:
                n["email_subject"] = _refined_emails[n["notification_id"]]["email_subject"]
                n["email_body"] = _refined_emails[n["notification_id"]]["email_body"]
        return notifs

    except Exception as e:

        logger.exception(
            "[NOTIFICATIONS ERROR]"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@app.post(
    "/api/notifications/{notification_id}/read"
)
async def read_notification(
    notification_id: str
):

    try:

        logger.info(
            f"[READ NOTIFICATION] {notification_id}"
        )

        return {
            "status": "success"
        }

    except Exception as e:

        logger.exception(
            "[READ NOTIFICATION ERROR]"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# ============================================================
# HISTORY
# ============================================================

@app.get(
    "/api/history/{lead_id}",
    response_model=List[HistoryItem]
)
async def history(
    lead_id: str
):

    try:

        logger.info(
            f"[HISTORY] {lead_id}"
        )

        return get_communication_history(
            lead_id
        )

    except Exception as e:

        logger.exception(
            "[HISTORY ERROR]"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
@app.post("/api/preview-emails")
async def preview_emails(payload: dict):
    try:
        from tools.tool import generate_personalized_emails
        
        user_id = payload.get("user_id")
        lead_ids = payload.get("lead_ids", [])
        sender_product = payload.get("sender_product", "")

        profile = get_user_profile(user_id)
        sender_name = profile.get("name", "") if profile else ""
        sender_company = profile.get("company", "") if profile else ""

        all_leads = []
        for lead_id in lead_ids:
            lead = get_lead_by_id(lead_id)
            if lead:
                all_leads.append(lead)

        emails = await generate_personalized_emails(
            leads=all_leads,
            sender_product=sender_product,
            sender_name=sender_name,
            sender_company=sender_company
        )

        # Return as map: email → {subject, body}
        email_map = {
            e["lead_email"]: {
                "subject": e["subject"],
                "body": e["body"]
            }
            for e in emails
        }

        return {"emails": email_map}

    except Exception as e:
        logger.exception("[PREVIEW EMAILS ERROR]")
        return {"emails": {}}

@app.get("/api/history/{lead_id}", response_model=List[HistoryItem])
async def history(lead_id: str, user_id: str = None):
    try:
        logger.info(f"[HISTORY] {lead_id}")
        from utils.bq_helper import get_user_communication_history_for_lead
        if user_id:
            return get_user_communication_history_for_lead(lead_id, user_id)
        return get_communication_history(lead_id)
    except Exception as e:
        logger.exception("[USER HISTORY ERROR]")
        raise HTTPException(status_code=500, detail=str(e))



# ============================================================
# WEBSOCKET
# ============================================================

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: str
):

    await manager.connect(
        user_id,
        websocket
    )

    try:

        while True:

            data = await websocket.receive_text()

            logger.info(
                f"[WS MESSAGE] {user_id}: {data}"
            )

    except WebSocketDisconnect:

        manager.disconnect(
            user_id
        )

@app.get("/api/leads/history/{user_id}")
async def get_lead_search_history(user_id: str):
    try:
        from utils.bq_helper import get_last_lead_search, get_lead_by_id, get_user_lead_statuses
        import json as json_module

        last_search = get_last_lead_search(user_id)
        if not last_search:
            return {"leads": [], "criteria": ""}

        lead_ids = json_module.loads(last_search["lead_ids"])
        leads = []
        for lead_id in lead_ids:
            lead = get_lead_by_id(lead_id)
            if lead:
                leads.append(lead)

        # Overlay per-user status
        if leads:
            user_statuses = get_user_lead_statuses(user_id, lead_ids)
            for lead in leads:
                lead["lead_status"] = user_statuses.get(lead["id"], "new")

        return {
            "leads": leads,
            "criteria": last_search["criteria"]
        }
    except Exception as e:
        logger.exception("[LEAD HISTORY ERROR]")
        raise HTTPException(status_code=500, detail=str(e))

from services.scheduler import start_scheduler, shutdown_scheduler

@app.on_event("startup")
async def startup():
    start_scheduler()

@app.on_event("shutdown")
async def shutdown():
    shutdown_scheduler()

# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8080
    )