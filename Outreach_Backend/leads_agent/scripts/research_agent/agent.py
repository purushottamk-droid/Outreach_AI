# ============================================================
# FILE: scripts/research_agent/agent.py
# ============================================================

from google.adk.agents.llm_agent import LlmAgent
from google.genai import types
from pydantic import BaseModel, Field
from typing import Optional, List
from dto.models import ResearchAgentOutput
from tools.tool import search_leads_tool
from scripts.research_agent.prompts import instruction
import logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

logger.info("[RESEARCH AGENT] Initialized successfully | tools=search_leads_tool")


# =========================
# AGENT
# =========================

research_agent = LlmAgent(
    model="gemini-2.5-flash",

    name="lead_research_agent",

    description=(
        "Conversational lead discovery and personalization agent that finds leads, analyzes enriched lead data, "
    ),

    # ✅ Structured output
    output_schema=ResearchAgentOutput,

    # ✅ Save output to state (important for downstream agents)
    output_key="research_output",

    instruction=instruction,

    tools=[search_leads_tool],

    generate_content_config=types.GenerateContentConfig(
        temperature=0.3,
        max_output_tokens=6000
    )
)

