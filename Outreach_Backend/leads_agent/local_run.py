# local_run.py
import os
from dotenv import load_dotenv

load_dotenv()

# use vertex ai just like cloud run does
os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "TRUE"
os.environ["GOOGLE_CLOUD_PROJECT"]       = "atgeir-moae-dev"
os.environ["GOOGLE_CLOUD_LOCATION"]      = "us-central1"

# mock only secret manager and bigquery
# so gmail/calendar/history dont crash
# scraper and tech tool will work fully
import unittest.mock as mock

mock.patch(
    "utils.secret_helper.get_secret",
    return_value={
        "access_token":  "mock",
        "refresh_token": "mock",
        "client_id":     "mock",
        "client_secret": "mock",
        "token_uri":     "https://oauth2.googleapis.com/token"
    }
).start()

mock.patch(
    "utils.bq_helper.get_lead_by_email",
    return_value={
        "id":      "mock_lead_001",
        "email":   "john@acme.com",
        "name":    "John Doe",
        "company": "Acme AI",
        "status":  "active"
    }
).start()

mock.patch(
    "utils.bq_helper.insert_communication_log",
    return_value=None
).start()

mock.patch(
    "utils.bq_helper.fetch_communications_by_lead_id",
    return_value=[]
).start()

# now start the fastapi server
import uvicorn
from app import app

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080, reload=False)