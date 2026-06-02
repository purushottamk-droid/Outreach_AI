import uuid
import logging
from services.gmail_poller import poll_gmail_replies
from datetime import datetime, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from utils.bq_helper import (
    get_leads_due_for_followup,
    get_followup_config,
    create_pending_approval,
    update_lead_followup_count,
    update_lead_status
)

from services.websocket_manager import manager
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

scheduler = AsyncIOScheduler()





# ============================================================
# MAIN FOLLOWUP CHECKER
# ============================================================

async def check_followups():

    logger.info(
        "[SCHEDULER] Checking leads due for followup"
    )

    try:

        leads = get_leads_due_for_followup()

        logger.info(
            f"[SCHEDULER] Found {len(leads)} leads"
        )

        for lead in leads:

            try:

                lead_id = lead.get("id")

                logger.info(
                    f"[FOLLOWUP] Processing lead={lead_id}"
                )

                campaign_id = lead.get(
                    "campaign_id"
                )

                user_id = lead.get(
                    "campaign_user_id"
                ) or lead.get(
                    "user_id"
                )

                followup_count = lead.get(
                    "followup_count",
                    0
                )

                config = get_followup_config(
                    campaign_id
                )

                if not config:

                    logger.warning(
                        f"[FOLLOWUP] Missing config for campaign={campaign_id}"
                    )

                    continue

                next_followup_number = (
                    followup_count + 1
                )

                max_followups = config.get(
                    "max_followups",
                    3
                )

                if next_followup_number > max_followups:
                    logger.info(
                        f"[FOLLOWUP] Max followups reached for {lead_id}"
                    )
                    update_lead_status(
                        lead_id=lead_id,
                        status="cold"
                    )
                    from utils.bq_helper import upsert_user_lead_status
                    upsert_user_lead_status(
                        user_id=user_id,
                        lead_id=lead_id,
                        status="cold",
                        campaign_id=campaign_id
                    )
                    continue

                # ====================================================
                # GENERATE EMAIL — LLM PERSONALIZED
                # ====================================================

                from tools.tool import generate_personalized_emails
                from utils.bq_helper import get_user_profile

                profile = get_user_profile(user_id)
                sender_name = profile.get("name", "") if profile else ""
                sender_company = profile.get("company", "") if profile else ""
                sender_product = profile.get("product_service", "") if profile else ""

                personalized = await generate_personalized_emails(
                    leads=[lead],
                    sender_product=sender_product,
                    sender_name=sender_name,
                    sender_company=sender_company
                )

                email_data = personalized[0] if personalized else {}
                subject = email_data.get("subject", f"Following up - {lead.get('company', '')}")
                body = email_data.get("body", f"Hi {lead.get('name', '')}, just following up...")

                approval_id = str(
                    uuid.uuid4()
                )

                approval = {
                    "approval_id": approval_id,
                    "user_id": user_id,
                    "campaign_id": campaign_id,
                    "lead_id": lead_id,
                    "lead_name": lead.get("name"),
                    "lead_email": lead.get("email"),
                    "followup_number": next_followup_number,
                    "total_followups": max_followups,
                    "email_subject": subject,
                    "email_body": body,
                    "scheduled_time": datetime.utcnow().isoformat(),
                    "status": "pending",
                    "created_at": datetime.utcnow().isoformat()
                }

                # ====================================================
                # CREATE APPROVAL
                # ====================================================

                create_pending_approval(
                    approval
                )

                logger.info(
                    f"[FOLLOWUP] Approval created {approval_id}"
                )

                # ====================================================
                # DETERMINE NEXT FOLLOWUP DATE
                # ====================================================

                followup_mapping = {
                    1: config.get("followup_1_days", 3),
                    2: config.get("followup_2_days", 7),
                    3: config.get("followup_3_days", 14)
                }

                next_days = followup_mapping.get(
                    next_followup_number,
                    14
                )

                next_followup_date = (
                    datetime.utcnow() + timedelta(days=next_days)
                )

                # ====================================================
                # UPDATE LEAD FOLLOWUP COUNT
                # ====================================================

                update_lead_followup_count(
                    lead_id=lead_id,
                    next_followup=next_followup_date
                )

                logger.info(
                    f"[FOLLOWUP] Updated lead {lead_id}"
                )

                # ====================================================
                # PUSH WEBSOCKET NOTIFICATION
                # ====================================================

                await manager.send_to_user(
                    user_id,
                    {
                        "type": "followup_pending",
                        "data": {
                            "approval_id": approval_id,
                            "lead_name": lead.get("name"),
                            "count": next_followup_number
                        }
                    }
                )

                logger.info(
                    f"[FOLLOWUP] WebSocket pushed to {user_id}"
                )

            except Exception as lead_error:

                logger.exception(
                    f"[FOLLOWUP ERROR] lead={lead.get('id')} error={str(lead_error)}"
                )

    except Exception as e:

        logger.exception(
            f"[SCHEDULER ERROR] {str(e)}"
        )


# ============================================================
# START SCHEDULER
# ============================================================

def start_scheduler():

    logger.info(
        "[SCHEDULER] Starting APScheduler"
    )

    scheduler.add_job(
    check_followups,
    trigger="interval",
    hours=1,
    id="followup_scheduler",
    replace_existing=True
)

    scheduler.add_job(
        poll_gmail_replies,
        trigger="interval",
        minutes=5,
        id="gmail_reply_poller",
        replace_existing=True
    )

    scheduler.start()

    logger.info(
        "[SCHEDULER] Started successfully"
    )


# ============================================================
# STOP SCHEDULER
# ============================================================

def shutdown_scheduler():

    logger.info(
        "[SCHEDULER] Shutting down"
    )

    scheduler.shutdown()