# ============================================================
# FILE: scripts/coordinator/agent.py
# ============================================================

from google.adk.agents import LlmAgent, BaseAgent

from scripts.messaging_agent.agent import messaging_booking_agent
from scripts.research_agent.agent import research_agent

from scripts.campaign_agent.agent import campaign_agent
from scripts.followup_agent.agent import followup_agent
from scripts.reply_agent.agent import reply_classifier_agent

from scripts.coordinator.prompts import instruction
from google.genai import types
from tools.tool import (
    search_leads_tool,
    bulk_outreach_tool,
    classify_reply_tool
)

import os
import logging

from utils.config import PROJECT_ID, LOCATION

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "TRUE"
os.environ["GOOGLE_CLOUD_PROJECT"] = PROJECT_ID
os.environ["GOOGLE_CLOUD_LOCATION"] = LOCATION

logger.info(
    f"[COORDINATOR] Initializing | project={PROJECT_ID} location={LOCATION}"
)

coordinator = LlmAgent(
    name="Coordinator",
    model="gemini-2.5-flash",
    
    description=(
            "Conversational AI coordinator for lead discovery, outreach, "
            "campaign management, followups, and sales workflow orchestration."

    ),
    instruction=instruction,
    tools=[
        search_leads_tool,
        bulk_outreach_tool,
        classify_reply_tool
    ],
    sub_agents=[
        research_agent,
        messaging_booking_agent,
        campaign_agent,
        followup_agent,
        reply_classifier_agent
    ],
    generate_content_config=types.GenerateContentConfig(
        temperature=0.2,
        max_output_tokens=2000
)
)

logger.info(
    f"[COORDINATOR] Initialized successfully"
)