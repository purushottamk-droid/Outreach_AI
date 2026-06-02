# ============================================================
# FILE: scripts/followup_agent/agent.py
# ============================================================

from google.adk.agents.llm_agent import LlmAgent

from scripts.followup_agent.prompts import instruction

from utils.config import PROJECT_ID, LOCATION

import os

os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "TRUE"
os.environ["GOOGLE_CLOUD_PROJECT"] = PROJECT_ID
os.environ["GOOGLE_CLOUD_LOCATION"] = LOCATION

followup_agent = LlmAgent(
    name="followup_agent",
    model="gemini-2.5-flash",
    description=(
        "Creates and manages follow-up schedules for outreach campaigns."
    ),
    instruction=instruction
)