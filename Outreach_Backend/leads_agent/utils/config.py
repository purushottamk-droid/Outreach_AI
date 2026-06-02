# =========================
# APP CONFIG
# =========================

APP_NAME = "leads_agent"

# =========================
# GCP CONFIG
# =========================

PROJECT_ID = "atgeir-moae-dev"
LOCATION = "us-central1"
#AGENT_ENGINE_ID = "your-agent-engine-id"

# =========================
# BIGQUERY CONFIG
# =========================

DATASET = "leads_meta"
LEADS_TABLE = f"{PROJECT_ID}.{DATASET}.leads"
COMM_TABLE = f"{PROJECT_ID}.{DATASET}.communication_logs"

# =========================
# SECRET MANAGER CONFIG
# =========================

DEFAULT_VERSION = "latest"
MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 1

# =========================
# GMAIL CONFIG
# =========================

SECRET_ID ="leads-agent-oauth-credentials"
GMAIL_SCOPES = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.readonly"
]

# =========================
# CALENDAR CONFIG
# =========================

#CALENDAR_SECRET_ID = "google-calendar-credentials"
CALENDAR_SCOPES = ["https://www.googleapis.com/auth/calendar"]



USER_PROFILES_TABLE = f"{PROJECT_ID}.{DATASET}.user_profiles"
CAMPAIGNS_TABLE = f"{PROJECT_ID}.{DATASET}.campaigns"
FOLLOWUP_CONFIGS_TABLE = f"{PROJECT_ID}.{DATASET}.followup_configs"
PENDING_APPROVALS_TABLE = f"{PROJECT_ID}.{DATASET}.pending_approvals"