# ============================================================
# FILE: scripts/campaign_agent/agent.py
# ============================================================

from google.adk.agents.llm_agent import LlmAgent

from scripts.campaign_agent.prompts import instruction

from utils.config import PROJECT_ID, LOCATION

import os

os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "TRUE"
os.environ["GOOGLE_CLOUD_PROJECT"] = PROJECT_ID
os.environ["GOOGLE_CLOUD_LOCATION"] = LOCATION

campaign_agent = LlmAgent(
    name="campaign_agent",
    model="gemini-2.5-flash",
    description=(
        "Creates outreach campaigns with target criteria and lead lists."
    ),
    instruction=instruction
)