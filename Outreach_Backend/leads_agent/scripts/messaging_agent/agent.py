# ============================================================
# FILE: scripts/messaging_agent/agent.py
# ============================================================


from google.adk.agents.llm_agent import LlmAgent
from google.genai import types
from pydantic import BaseModel, Field
from typing import Optional, List
from dto.models import ResearchAgentOutput
from tools.tool import gmail_tool,calendar_tool,history_tool
from scripts.messaging_agent.prompts import instruction
import logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

logger.info("[MESSAGING AGENT] Initializing | model=gemini-2.5-flash")

# =========================
# AGENT
# =========================

messaging_booking_agent = LlmAgent(
    model="gemini-2.5-flash",

    name="messaging_booking_agent",

    description=(
        "Conversational messaging cum booking agent that sends messages/do followups as well"
    ),

    # ✅ Save output to state (important for downstream agents)
    output_key="messaging_booking_output",

    instruction=instruction,

    tools=[gmail_tool,history_tool,calendar_tool],

    generate_content_config=types.GenerateContentConfig(
        temperature=0.3,
        max_output_tokens=6000
    )
)

logger.info("[MESSAGING AGENT] Initialized successfully | tools=gmail_tool,history_tool,calendar_tool")
