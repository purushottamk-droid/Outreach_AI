# ============================================================
# FILE: scripts/reply_agent/agent.py
# ============================================================

from google.adk.agents.llm_agent import LlmAgent

from scripts.reply_agent.prompts import instruction

from tools.tool import classify_reply_tool

from utils.config import PROJECT_ID, LOCATION

import os

os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "TRUE"
os.environ["GOOGLE_CLOUD_PROJECT"] = PROJECT_ID
os.environ["GOOGLE_CLOUD_LOCATION"] = LOCATION

reply_classifier_agent = LlmAgent(
    name="reply_classifier_agent",
    model="gemini-2.5-flash",
    description=(
        "Analyzes inbound lead replies and classifies intent."
    ),
    instruction=instruction,
    tools=[
        classify_reply_tool
    ]
)