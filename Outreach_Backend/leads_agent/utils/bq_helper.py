import logging
import time
from datetime import datetime
from typing import List, Dict, Any, Optional

from google.cloud import bigquery
from google.api_core.exceptions import GoogleAPIError

from utils.config import (
    PROJECT_ID,
    LEADS_TABLE,
    COMM_TABLE,
    USER_PROFILES_TABLE,
    CAMPAIGNS_TABLE,
    FOLLOWUP_CONFIGS_TABLE,
    PENDING_APPROVALS_TABLE
)

client = bigquery.Client(project=PROJECT_ID)

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


# ============================================================================
# RETRY WRAPPER
# ============================================================================

def execute_write_query(
    query: str,
    job_config: bigquery.QueryJobConfig
) -> None:

    for attempt in range(1, 4):

        try:

            client.query(
                query,
                job_config=job_config
            ).result()

            return

        except GoogleAPIError as e:

            logger.warning(
                f"Attempt {attempt} failed: {e}"
            )

            if attempt == 3:
                logger.exception(
                    "BigQuery write failed after retries"
                )
                raise RuntimeError(
                    "BigQuery write failed"
                ) from e

            time.sleep(2 ** attempt)


# ============================================================================
# EXISTING FUNCTIONS
# ============================================================================

def insert_communication_log(row: Dict[str, Any]) -> None:

    table_id = COMM_TABLE

    for attempt in range(1, 4):

        try:

            errors = client.insert_rows_json(
                table_id,
                [row]
            )

            if errors:
                logger.error(
                    f"BigQuery insert errors: {errors}"
                )
                raise RuntimeError(
                    f"Insert failed: {errors}"
                )

            logger.debug(
                "BigQuery insert successful"
            )

            return

        except GoogleAPIError as e:

            logger.warning(
                f"Attempt {attempt} failed: {e}"
            )

            if attempt == 3:

                logger.exception(
                    "BigQuery insert failed after retries"
                )

                raise RuntimeError(
                    "BigQuery insert failed"
                ) from e

            time.sleep(2 * attempt)


def get_lead_by_email(
    email: str
) -> Optional[Dict[str, Any]]:

    query = f"""
        SELECT *
        FROM `{LEADS_TABLE}`
        WHERE email = @email
        LIMIT 1
    """

    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter(
                "email",
                "STRING",
                email
            )
        ]
    )

    try:

        results = client.query(
            query,
            job_config=job_config
        ).result()

        rows = [dict(row) for row in results]

        return rows[0] if rows else None

    except GoogleAPIError:

        logger.exception(
            "Failed to fetch lead"
        )

        return None


def fetch_communications_by_lead_id(
    lead_id: str,
    limit: int
) -> List[Dict[str, Any]]:

    query = f"""
        SELECT *
        FROM `{COMM_TABLE}`
        WHERE lead_id = @lead_id
        ORDER BY created_at DESC
        LIMIT @limit
    """

    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter(
                "lead_id",
                "STRING",
                lead_id
            ),
            bigquery.ScalarQueryParameter(
                "limit",
                "INT64",
                limit
            )
        ]
    )

    try:

        results = client.query(
            query,
            job_config=job_config
        ).result()

        return [dict(row) for row in results]

    except GoogleAPIError:

        logger.exception(
            "Failed to fetch communications"
        )

        return []


# ============================================================================
# SEARCH LEADS
# ============================================================================

def search_leads(
   
    industries: Optional[List[str]] = None,
    job_roles: Optional[List[str]] = None,
    company_size: Optional[str] = None,
    geography: Optional[str] = None,
    limit: int = 20
) -> List[Dict]:

    logger.info(
        "Searching leads"
    )

    conditions = []

    query_parameters = []

    if industries:
        conditions.append("""
            LOWER(industry) IN UNNEST(
                @industries
            )
        """)

        query_parameters.append(
            bigquery.ArrayQueryParameter(
                "industries",
                "STRING",
                [i.lower() for i in industries]
            )
        )

   
    if job_roles:
        conditions.append("""
                LOWER(job_role) IN UNNEST(@job_roles)
            """)

        query_parameters.append(
            bigquery.ArrayQueryParameter(
                "job_roles",
                "STRING",
                [r.lower() for r in job_roles]
            )
        )

    if company_size:
        conditions.append(
            "LOWER(REPLACE(REPLACE(company_size, '-', ''), '–', '')) = LOWER(REPLACE(REPLACE(@company_size, '-', ''), '–', ''))"
        )
        query_parameters.append(
            bigquery.ScalarQueryParameter(
                "company_size",
                "STRING",
                company_size
            )
        )

    if geography:
        conditions.append(
            "LOWER(geography) = LOWER(@geography)"
        )
        query_parameters.append(
            bigquery.ScalarQueryParameter(
                "geography",
                "STRING",
                geography
            )
        )

    query_parameters.append(
        bigquery.ScalarQueryParameter(
            "limit",
            "INT64",
            limit
        )
    )

    where_clause = " AND ".join(conditions)

    query = f"""
        SELECT *
        FROM `{LEADS_TABLE}`
        WHERE {where_clause}
        ORDER BY created_at DESC
        LIMIT @limit
    """

    job_config = bigquery.QueryJobConfig(
        query_parameters=query_parameters
    )

    try:

        results = client.query(
            query,
            job_config=job_config
        ).result()

        return [dict(row) for row in results]

    except GoogleAPIError:

        logger.exception(
            "Lead search failed"
        )

        return []


def get_lead_by_id(
    lead_id: str
) -> Optional[Dict]:

    query = f"""
        SELECT *
        FROM `{LEADS_TABLE}`
        WHERE id = @lead_id
        LIMIT 1
    """

    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter(
                "lead_id",
                "STRING",
                lead_id
            )
        ]
    )

    try:

        results = client.query(
            query,
            job_config=job_config
        ).result()

        rows = [dict(row) for row in results]

        return rows[0] if rows else None

    except GoogleAPIError:

        logger.exception(
            "Lead fetch failed"
        )

        return None


def update_lead_status(
    lead_id: str,
    status: str
) -> None:

    logger.info(
        f"Updating lead status: {lead_id}"
    )

    query = f"""
        UPDATE `{LEADS_TABLE}`
        SET lead_status = @status
        WHERE id = @lead_id
    """

    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter(
                "status",
                "STRING",
                status
            ),
            bigquery.ScalarQueryParameter(
                "lead_id",
                "STRING",
                lead_id
            )
        ]
    )

    execute_write_query(
        query,
        job_config
    )


def update_lead_after_email(
    lead_id: str,
    campaign_id: str,
    next_followup: datetime
) -> None:

    query = f"""
    UPDATE `{LEADS_TABLE}`
    SET
        last_contacted = CURRENT_TIMESTAMP(),
        campaign_id = @campaign_id,
        next_followup = @next_followup
    WHERE id = @lead_id
"""

    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter(
                "campaign_id",
                "STRING",
                campaign_id
            ),
            bigquery.ScalarQueryParameter(
                "next_followup",
                "TIMESTAMP",
                next_followup
            ),
            bigquery.ScalarQueryParameter(
                "lead_id",
                "STRING",
                lead_id
            )
        ]
    )

    execute_write_query(
        query,
        job_config
    )


# ============================================================================
# FIXED USER PROFILE
# ============================================================================

def save_user_profile(
    profile: dict
) -> None:

    query = f"""
    MERGE `{USER_PROFILES_TABLE}` T
    USING (
        SELECT
            @user_id AS user_id,
            @name AS name,
            @email AS email,
            @company AS company,
            @product_service AS product_service,
            @target_industry AS target_industry,
            @target_role AS target_role,
            @target_size AS target_size,
            @geography AS geography,
            @updated_at AS updated_at
    ) S
    ON T.user_id = S.user_id

    WHEN MATCHED THEN
      UPDATE SET
        name = S.name,
        email = S.email,
        company = S.company,
        product_service = S.product_service,
        target_industry = S.target_industry,
        target_role = S.target_role,
        target_size = S.target_size,
        geography = S.geography,
        updated_at = S.updated_at

    WHEN NOT MATCHED THEN
      INSERT (
        user_id,
        name,
        email,
        company,
        product_service,
        target_industry,
        target_role,
        target_size,
        geography,
        updated_at
      )
      VALUES (
        S.user_id,
        S.name,
        S.email,
        S.company,
        S.product_service,
        S.target_industry,
        S.target_role,
        S.target_size,
        S.geography,
        S.updated_at
      )
    """

    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("user_id", "STRING", profile.get("user_id")),
            bigquery.ScalarQueryParameter("name", "STRING", profile.get("name")),
            bigquery.ScalarQueryParameter("email", "STRING", profile.get("email")),
            bigquery.ScalarQueryParameter("company", "STRING", profile.get("company")),
            bigquery.ScalarQueryParameter("product_service", "STRING", profile.get("product_service")),
            bigquery.ScalarQueryParameter("target_industry", "STRING", profile.get("target_industry")),
            bigquery.ScalarQueryParameter("target_role", "STRING", profile.get("target_role")),
            bigquery.ScalarQueryParameter("target_size", "STRING", profile.get("target_size")),
            bigquery.ScalarQueryParameter("geography", "STRING", profile.get("geography")),
            bigquery.ScalarQueryParameter("updated_at", "TIMESTAMP", profile.get("updated_at"))
        ]
    )

    execute_write_query(query, job_config)


# ============================================================================
# GET USER PROFILE
# ============================================================================

def get_user_profile(
    user_id: str
) -> Optional[Dict]:

    query = f"""
        SELECT *
        FROM `{USER_PROFILES_TABLE}`
        WHERE user_id = @user_id
        LIMIT 1
    """

    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter(
                "user_id",
                "STRING",
                user_id
            )
        ]
    )

    try:

        results = client.query(
            query,
            job_config=job_config
        ).result()

        rows = [dict(row) for row in results]

        return rows[0] if rows else None

    except GoogleAPIError:

        logger.exception(
            "Failed to fetch user profile"
        )

        return None


# ============================================================================
# CAMPAIGNS
# ============================================================================

def create_campaign(
    campaign: dict
) -> str:

    campaign_id = campaign.get(
        "campaign_id"
    )

    errors = client.insert_rows_json(
        CAMPAIGNS_TABLE,
        [campaign]
    )

    if errors:
        logger.error(errors)
        raise RuntimeError(
            "Campaign insert failed"
        )

    return campaign_id


def get_campaigns(
    user_id: str
) -> List[Dict]:

    query = f"""
        SELECT *
        FROM `{CAMPAIGNS_TABLE}`
        WHERE user_id = @user_id
        ORDER BY created_at DESC
    """

    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter(
                "user_id",
                "STRING",
                user_id
            )
        ]
    )

    try:

        results = client.query(
            query,
            job_config=job_config
        ).result()

        rows = [dict(row) for row in results]
        for row in rows:
            live_stats = get_campaign_stats_live(row["campaign_id"])
            row["emails_sent"] = live_stats["emails_sent"]
            row["replies_received"] = live_stats["replies_received"]
            row["meetings_booked"] = live_stats["meetings_booked"]
        return rows

    except GoogleAPIError:

        logger.exception(
            "Failed to fetch campaigns"
        )

        return []


def update_campaign_stats(
    campaign_id: str,
    field: str,
    increment: int
) -> None:

    allowed_fields = [
        "emails_sent",
        "replies_received",
        "meetings_booked",
        "lead_count"
    ]

    if field not in allowed_fields:
        raise ValueError(
            "Invalid campaign stats field"
        )

    query = f"""
        UPDATE `{CAMPAIGNS_TABLE}`
        SET {field} = {field} + @increment
        WHERE campaign_id = @campaign_id
    """

    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("increment", "INT64", increment),
            bigquery.ScalarQueryParameter("campaign_id", "STRING", campaign_id)
        ]
    )

    execute_write_query(query, job_config)


# ============================================================================
# FIXED FOLLOWUP CONFIG
# ============================================================================

def save_followup_config(
    config: dict
) -> str:

    config_id = config.get("config_id")

    query = f"""
    MERGE `{FOLLOWUP_CONFIGS_TABLE}` T
    USING (
        SELECT
            @config_id AS config_id,
            @campaign_id AS campaign_id,
            @user_id AS user_id,
            @followup_1_days AS followup_1_days,
            @followup_2_days AS followup_2_days,
            @followup_3_days AS followup_3_days,
            @max_followups AS max_followups,
            @llm_recommended AS llm_recommended,
            @created_at AS created_at,
            @updated_at AS updated_at
    ) S
    ON T.config_id = S.config_id

    WHEN MATCHED THEN
      UPDATE SET
        campaign_id = S.campaign_id,
        user_id = S.user_id,
        followup_1_days = S.followup_1_days,
        followup_2_days = S.followup_2_days,
        followup_3_days = S.followup_3_days,
        max_followups = S.max_followups,
        llm_recommended = S.llm_recommended,
        updated_at = S.updated_at

    WHEN NOT MATCHED THEN
      INSERT (
        config_id,
        campaign_id,
        user_id,
        followup_1_days,
        followup_2_days,
        followup_3_days,
        max_followups,
        llm_recommended,
        created_at,
        updated_at
      )
      VALUES (
        S.config_id,
        S.campaign_id,
        S.user_id,
        S.followup_1_days,
        S.followup_2_days,
        S.followup_3_days,
        S.max_followups,
        S.llm_recommended,
        S.created_at,
        S.updated_at
      )
    """

    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("config_id", "STRING", config.get("config_id")),
            bigquery.ScalarQueryParameter("campaign_id", "STRING", config.get("campaign_id")),
            bigquery.ScalarQueryParameter("user_id", "STRING", config.get("user_id")),
            bigquery.ScalarQueryParameter("followup_1_days", "INT64", config.get("followup_1_days")),
            bigquery.ScalarQueryParameter("followup_2_days", "INT64", config.get("followup_2_days")),
            bigquery.ScalarQueryParameter("followup_3_days", "INT64", config.get("followup_3_days")),
            bigquery.ScalarQueryParameter("max_followups", "INT64", config.get("max_followups")),
            bigquery.ScalarQueryParameter("llm_recommended", "BOOL", config.get("llm_recommended")),
            bigquery.ScalarQueryParameter("created_at", "TIMESTAMP", config.get("created_at")),
            bigquery.ScalarQueryParameter("updated_at", "TIMESTAMP", config.get("updated_at"))
        ]
    )

    execute_write_query(query, job_config)

    return config_id

def increment_campaign_lead_count(
    campaign_id: str,
    lead_id: str
) -> None:
    check_query = f"""
        SELECT id FROM `{LEADS_TABLE}`
        WHERE id = @lead_id
        AND campaign_id = @campaign_id
        LIMIT 1
    """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("lead_id", "STRING", lead_id),
            bigquery.ScalarQueryParameter("campaign_id", "STRING", campaign_id)
        ]
    )
    try:
        results = list(client.query(check_query, job_config=job_config).result())
        if results:
            logger.info(f"Lead {lead_id} already in campaign {campaign_id}, skipping count")
            return
        update_campaign_stats(campaign_id, "lead_count", 1)
    except GoogleAPIError:
        logger.exception("Failed to increment campaign lead count")
def get_campaign_stats_live(campaign_id: str) -> Dict:
    query = f"""
        SELECT
            COUNTIF(type = 'email' AND direction = 'outbound') as emails_sent,
            COUNTIF(type = 'reply' AND direction = 'inbound') as replies_received,
            COUNTIF(type = 'meeting' AND direction = 'outbound') as meetings_booked
        FROM `{COMM_TABLE}`
        WHERE campaign_id = @campaign_id
    """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("campaign_id", "STRING", campaign_id)
        ]
    )
    try:
        results = list(client.query(query, job_config=job_config).result())
        if results:
            row = dict(results[0])
            return {
                "emails_sent": row.get("emails_sent") or 0,
                "replies_received": row.get("replies_received") or 0,
                "meetings_booked": row.get("meetings_booked") or 0
            }
        return {"emails_sent": 0, "replies_received": 0, "meetings_booked": 0}
    except GoogleAPIError:
        logger.exception("Failed to get live campaign stats")
        return {"emails_sent": 0, "replies_received": 0, "meetings_booked": 0}

def get_followup_config(
    campaign_id: str
) -> Optional[Dict]:

    query = f"""
        SELECT *
        FROM `{FOLLOWUP_CONFIGS_TABLE}`
        WHERE campaign_id = @campaign_id
        LIMIT 1
    """

    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter(
                "campaign_id",
                "STRING",
                campaign_id
            )
        ]
    )

    try:

        results = client.query(
            query,
            job_config=job_config
        ).result()

        rows = [dict(row) for row in results]

        return rows[0] if rows else None

    except GoogleAPIError:

        logger.exception(
            "Failed to fetch followup config"
        )

        return None


# ============================================================================
# FOLLOWUPS
# ============================================================================

def get_leads_due_for_followup() -> List[Dict]:

    query = f"""
        SELECT *
        FROM `{LEADS_TABLE}`
        WHERE next_followup <= CURRENT_TIMESTAMP()
        AND lead_status = 'contacted'
        AND followup_count < 3
    """

    try:

        results = client.query(query).result()

        return [dict(row) for row in results]

    except GoogleAPIError:

        logger.exception(
            "Failed to fetch due followups"
        )

        return []


# ============================================================================
# APPROVALS
# ============================================================================

def create_pending_approval(
    approval: dict
) -> str:

    approval_id = approval.get("approval_id")

    errors = client.insert_rows_json(
        PENDING_APPROVALS_TABLE,
        [approval]
    )

    if errors:
        logger.error(errors)
        raise RuntimeError(
            "Pending approval insert failed"
        )

    return approval_id


def get_pending_approvals(
    user_id: str
) -> List[Dict]:

    query = f"""
        SELECT *
        FROM `{PENDING_APPROVALS_TABLE}`
        WHERE user_id = @user_id
        AND status = 'pending'
        ORDER BY created_at DESC
    """

    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("user_id", "STRING", user_id)
        ]
    )

    try:

        results = client.query(
            query,
            job_config=job_config
        ).result()

        return [dict(row) for row in results]

    except GoogleAPIError:

        logger.exception(
            "Failed to fetch approvals"
        )

        return []


def update_approval_status(
    approval_id: str,
    status: str
) -> None:

    query = f"""
        UPDATE `{PENDING_APPROVALS_TABLE}`
        SET status = @status
        WHERE approval_id = @approval_id
    """

    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("status", "STRING", status),
            bigquery.ScalarQueryParameter("approval_id", "STRING", approval_id)
        ]
    )

    execute_write_query(query, job_config)


# ============================================================================
# FIXED COMMUNICATION LOG V2
# ============================================================================

def insert_communication_log_v2(
    log: dict
) -> None:

    row = {
        "id": log.get("id"),
        "lead_id": log.get("lead_id"),
        "campaign_id": log.get("campaign_id"),
        "user_id": log.get("user_id"),
        "type": log.get("type"),
        "direction": log.get("direction"),
        "status": log.get("status"),
        "to_email": log.get("to_email"),
        "subject": log.get("subject"),
        "body": log.get("body"),
        "message_id": log.get("message_id"),
        "followup_number": log.get("followup_number"),
        "reply_text": log.get("reply_text"),
        "reply_classification": log.get("reply_classification"),
        "reply_confidence": log.get("reply_confidence"),
        "summary": log.get("summary"),
        "start_time": log.get("start_time"),
        "end_time": log.get("end_time"),
        "event_link": log.get("event_link"),
        "error_message": log.get("error_message"),
        "created_at": log.get("created_at")
    }

    for attempt in range(1, 4):

        try:

            errors = client.insert_rows_json(
                COMM_TABLE,
                [row]
            )

            if errors:
                logger.error(
                    f"BigQuery insert errors: {errors}"
                )
                raise RuntimeError(
                    f"Insert failed: {errors}"
                )

            logger.debug(
                "Communication log inserted successfully"
            )

            return

        except GoogleAPIError as e:

            logger.warning(
                f"Attempt {attempt} failed: {e}"
            )

            if attempt == 3:

                logger.exception(
                    "Communication log insert failed after retries"
                )

                raise RuntimeError(
                    "Communication log insert failed"
                ) from e

            time.sleep(2 ** attempt)


# ============================================================================
# HISTORY
# ============================================================================

def get_communication_history(
    lead_id: str,
    limit: int = 20
) -> List[Dict]:

    return fetch_communications_by_lead_id(
        lead_id,
        limit
    )


# ============================================================================
# NOTIFICATIONS
# ============================================================================

# def get_notifications(user_id: str) -> List[Dict]:
#     approvals = get_pending_approvals(user_id)
#     notifications = []

#     for approval in approvals:
#         followup_number = approval.get("followup_number", 0)

#         if followup_number == 0:
#             # Positive reply — scheduling email approval
#             notifications.append({
#                 "notification_id": approval.get("approval_id"),
#                 "user_id": approval.get("user_id"),
#                 "type": "reply",
#                 "title": f"Positive reply from {approval.get('lead_name')}",
#                 "subtitle": f"Approve scheduling email to {approval.get('lead_email')}",
#                 "time": str(approval.get("created_at")),
#                 "action": "approve_followup",
#                 "read": False
#             })
#         elif followup_number == 1:
#             # Meeting details received — confirmation email approval
#             notifications.append({
#                 "notification_id": approval.get("approval_id"),
#                 "user_id": approval.get("user_id"),
#                 "type": "meeting",
#                 "title": f"Meeting details from {approval.get('lead_name')}",
#                 "subtitle": f"Approve meeting confirmation email",
#                 "time": str(approval.get("created_at")),
#                 "action": "approve_followup",
#                 "read": False
#             })
#         else:
#             # Regular followup approval
#             notifications.append({
#                 "notification_id": approval.get("approval_id"),
#                 "user_id": approval.get("user_id"),
#                 "type": "followup",
#                 "title": "Follow-up approval needed",
#                 "subtitle": f"Approve outreach for {approval.get('lead_name')}",
#                 "time": str(approval.get("created_at")),
#                 "action": "approve_followup",
#                 "read": False
#             })

#     return notifications
# ============================================================================
# NOTIFICATIONS
# ============================================================================

def get_notifications(user_id: str) -> List[Dict]:
    approvals = get_pending_approvals(user_id)
    
    # Filter out dismissed approvals
    try:
        dismissed_query = f"""
            SELECT approval_id FROM `{PROJECT_ID}.leads_meta.dismissed_approvals`
            WHERE user_id = @user_id
        """
        job_config = bigquery.QueryJobConfig(
            query_parameters=[bigquery.ScalarQueryParameter("user_id", "STRING", user_id)]
        )
        dismissed_results = client.query(dismissed_query, job_config=job_config).result()
        dismissed_ids = {row["approval_id"] for row in dismissed_results}
        approvals = [a for a in approvals if a.get("approval_id") not in dismissed_ids]
    except Exception as e:
        logger.warning(f"Failed to fetch dismissed approvals: {e}")
    notifications = []

    for approval in approvals:
        followup_number = approval.get("followup_number", 0)

        if followup_number == 0:
            is_reply_display = approval.get("email_subject") == "REPLY_DISPLAY"

            if is_reply_display:
                notifications.append({
                    "notification_id": approval.get("approval_id"),
                    "user_id": approval.get("user_id"),
                    "type": "reply",
                    "title": f"Positive reply from {approval.get('lead_name')}",
                    "subtitle": f"Replied from {approval.get('lead_email')}",
                    "time": str(approval.get("created_at")),
                    "action": "reply_display",
                    "read": False,
                    "email_body": approval.get("email_body"),  # lead's reply text
                    "email_subject": None,
                    "lead_email": approval.get("lead_email"),
                    "lead_name": approval.get("lead_name"),
                    "meeting_date": None,
                    "duration": None,
                })
            else:
                notifications.append({
                    "notification_id": approval.get("approval_id"),
                    "user_id": approval.get("user_id"),
                    "type": "followup",
                    "title": f"Scheduling email ready for {approval.get('lead_name')}",
                    "subtitle": f"Review and approve email to {approval.get('lead_email')}",
                    "time": str(approval.get("created_at")),
                    "action": "approve_followup",
                    "read": False,
                    "email_body": approval.get("email_body"),  # LLM drafted body
                    "email_subject": approval.get("email_subject"),
                    "lead_email": approval.get("lead_email"),
                    "lead_name": approval.get("lead_name"),
                    "meeting_date": None,
                    "duration": None,
                })

        elif followup_number == 1:
            # Meeting details received — parse JSON body for date/duration
            # ✅ NEW: Parse meeting details from email_body JSON
            try:
                import json as _json
                body_data = _json.loads(approval.get("email_body", "{}"))
                meeting_date = body_data.get("meeting_details", {}).get("date", "")
                duration = body_data.get("duration", 30)
            except:
                meeting_date = ""
                duration = 30

            notifications.append({
                "notification_id": approval.get("approval_id"),
                "user_id": approval.get("user_id"),
                "type": "meeting",
                "title": f"Meeting details from {approval.get('lead_name')}",
                "subtitle": "Approve meeting confirmation email",
                "time": str(approval.get("created_at")),
                "action": "approve_followup",
                "read": False,
                # ✅ NEW FIELDS ADDED
                "email_body": approval.get("email_body"),
                "email_subject": approval.get("email_subject"),
                "lead_email": approval.get("lead_email"),
                "lead_name": approval.get("lead_name"),
                "meeting_date": meeting_date,
                "duration": duration,
            })

        else:
            # Regular followup approval
            notifications.append({
                "notification_id": approval.get("approval_id"),
                "user_id": approval.get("user_id"),
                "type": "followup",
                "title": "Follow-up approval needed",
                "subtitle": f"Approve outreach for {approval.get('lead_name')}",
                "time": str(approval.get("created_at")),
                "action": "approve_followup",
                "read": False,
                # ✅ NEW FIELDS ADDED
                "email_body": approval.get("email_body"),
                "email_subject": approval.get("email_subject"),
                "lead_email": approval.get("lead_email"),
                "lead_name": approval.get("lead_name"),
                "meeting_date": None,
                "duration": None,
            })

    return notifications

def update_lead_followup_count(
    lead_id: str,
    next_followup: datetime
) -> None:
    query = f"""
        UPDATE `{LEADS_TABLE}`
        SET
            followup_count = followup_count + 1,
            next_followup = @next_followup
        WHERE id = @lead_id
    """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("next_followup", "TIMESTAMP", next_followup),
            bigquery.ScalarQueryParameter("lead_id", "STRING", lead_id)
        ]
    )
    execute_write_query(query, job_config)

def get_last_sender_for_lead(lead_email: str) -> str:
    query = f"""
        SELECT user_id 
        FROM `{COMM_TABLE}`
        WHERE to_email = @lead_email
        AND direction = 'outbound'
        AND type = 'email'
        ORDER BY created_at DESC
        LIMIT 1
    """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("lead_email", "STRING", lead_email)
        ]
    )
    try:
        results = list(client.query(query, job_config=job_config).result())
        return results[0]["user_id"] if results else "user-klagwup"
    except Exception:
        logger.exception("Failed to get last sender")
        return "user-klagwup"

def update_approval_email(
    approval_id: str,
    email_subject: str,
    email_body: str
) -> None:
    query = f"""
        UPDATE `{PENDING_APPROVALS_TABLE}`
        SET
            email_subject = @email_subject,
            email_body = @email_body
        WHERE approval_id = @approval_id
    """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("email_subject", "STRING", email_subject),
            bigquery.ScalarQueryParameter("email_body", "STRING", email_body),
            bigquery.ScalarQueryParameter("approval_id", "STRING", approval_id)
        ]
    )
    execute_write_query(query, job_config)
def get_all_active_users() -> List[Dict]:
    query = f"""
        SELECT DISTINCT user_id
        FROM `{USER_PROFILES_TABLE}`
        WHERE user_id IS NOT NULL
    """
    try:
        results = client.query(query).result()
        return [dict(row) for row in results]
    except GoogleAPIError:
        logger.exception("Failed to fetch active users")
        return []

DISMISSED_APPROVALS_TABLE = f"{PROJECT_ID}.leads_meta.dismissed_approvals"
USER_LEAD_SEARCHES_TABLE = f"{PROJECT_ID}.leads_meta.user_lead_searches"
def dismiss_approval(approval_id: str, user_id: str) -> None:
    row = {
        "approval_id": approval_id,
        "user_id": user_id,
        "dismissed_at": datetime.utcnow().isoformat()
    }
    try:
        client.insert_rows_json(DISMISSED_APPROVALS_TABLE, [row])
        logger.info(f"Approval dismissed: {approval_id}")
    except Exception as e:
        logger.error(f"Failed to dismiss approval: {e}")

def get_user_communication_history(user_id: str) -> List[Dict]:
    query = f"""
        SELECT *
        FROM `{COMM_TABLE}`
        WHERE user_id = @user_id
        ORDER BY created_at DESC
        LIMIT 100
    """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("user_id", "STRING", user_id)
        ]
    )
    try:
        results = client.query(query, job_config=job_config).result()
        return [dict(row) for row in results]
    except GoogleAPIError:
        logger.exception("Failed to fetch user history")
        return []

   

def save_lead_search(user_id: str, lead_ids: List[str], criteria: str) -> None:
    import json as _json
    row = {
        "user_id": user_id,
        "searched_at": datetime.utcnow().isoformat(),
        "lead_ids": _json.dumps(lead_ids),
        "criteria": criteria
    }
    try:
        errors = client.insert_rows_json(USER_LEAD_SEARCHES_TABLE, [row])
        if errors:
            logger.error(f"save_lead_search errors: {errors}")
    except GoogleAPIError:
        logger.exception("Failed to save lead search")


def get_last_lead_search(user_id: str) -> Optional[Dict]:
    query = f"""
        SELECT 
            STRING_AGG(DISTINCT lead_id) as all_lead_ids,
            MAX(criteria) as criteria
        FROM (
            SELECT criteria, lead_id
            FROM `{USER_LEAD_SEARCHES_TABLE}`,
            UNNEST(JSON_VALUE_ARRAY(lead_ids)) as lead_id
            WHERE user_id = @user_id
        )
    """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("user_id", "STRING", user_id)
        ]
    )
    try:
        results = client.query(query, job_config=job_config).result()
        rows = [dict(row) for row in results]
        if not rows or not rows[0].get("all_lead_ids"):
            return None
        import json as _json
        lead_ids = rows[0]["all_lead_ids"].split(",")
        return {
            "lead_ids": _json.dumps(lead_ids),
            "criteria": rows[0]["criteria"] or "All previously found leads"
        }
    except GoogleAPIError:
        logger.exception("Failed to get all lead searches")
        return None

USER_LEAD_STATUS_TABLE = f"{PROJECT_ID}.leads_meta.user_lead_status"

def upsert_user_lead_status(
    user_id: str,
    lead_id: str,
    status: str,
    campaign_id: str = None
) -> None:
    query = f"""
        MERGE `{USER_LEAD_STATUS_TABLE}` T
        USING (
            SELECT
                @user_id AS user_id,
                @lead_id AS lead_id,
                @status AS status,
                @campaign_id AS campaign_id,
                @updated_at AS updated_at
        ) S
        ON T.user_id = S.user_id AND T.lead_id = S.lead_id
        WHEN MATCHED THEN
            UPDATE SET
                status = S.status,
                campaign_id = S.campaign_id,
                updated_at = S.updated_at
        WHEN NOT MATCHED THEN
            INSERT (user_id, lead_id, status, campaign_id, updated_at)
            VALUES (S.user_id, S.lead_id, S.status, S.campaign_id, S.updated_at)
    """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("user_id", "STRING", user_id),
            bigquery.ScalarQueryParameter("lead_id", "STRING", lead_id),
            bigquery.ScalarQueryParameter("status", "STRING", status),
            bigquery.ScalarQueryParameter("campaign_id", "STRING", campaign_id),
            bigquery.ScalarQueryParameter("updated_at", "TIMESTAMP", datetime.utcnow()),
        ]
    )
    execute_write_query(query, job_config)


def get_user_lead_statuses(
    user_id: str,
    lead_ids: List[str]
) -> Dict[str, str]:
    query = f"""
        SELECT lead_id, status
        FROM `{USER_LEAD_STATUS_TABLE}`
        WHERE user_id = @user_id
        AND lead_id IN UNNEST(@lead_ids)
    """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("user_id", "STRING", user_id),
            bigquery.ArrayQueryParameter("lead_ids", "STRING", lead_ids),
        ]
    )
    try:
        results = client.query(query, job_config=job_config).result()
        return {row["lead_id"]: row["status"] for row in results}
    except GoogleAPIError:
        logger.exception("Failed to fetch user lead statuses")
        return {}

        
def get_user_communication_history_for_lead(lead_id: str, user_id: str) -> List[Dict]:
    query = f"""
        SELECT *
        FROM `{COMM_TABLE}`
        WHERE lead_id = @lead_id
        AND user_id = @user_id
        ORDER BY created_at DESC
        LIMIT 50
    """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("lead_id", "STRING", lead_id),
            bigquery.ScalarQueryParameter("user_id", "STRING", user_id),
        ]
    )
    try:
        results = client.query(query, job_config=job_config).result()
        return [dict(row) for row in results]
    except GoogleAPIError:
        logger.exception("Failed to fetch user lead history")
        return []