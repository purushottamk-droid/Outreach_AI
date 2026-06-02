import asyncio
import json,re
import time
from typing import Dict, Any, Optional

from google.adk import Runner
from google.adk.sessions import VertexAiSessionService
from google.adk.events import Event, EventActions
from google.genai import types

from pydantic import BaseModel, Field, ValidationError

from scripts.coordinator.agent import coordinator as root_agent
from dto.models import LeadContext, AgentInput, AgentOutput
from utils.config import APP_NAME, PROJECT_ID, LOCATION #

import logging


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =========================
# CONFIG
# =========================

# APP_NAME = "leads_agent"

# PROJECT_ID = "your-project-id"
# LOCATION = "us-central1"
# AGENT_ENGINE_ID = "your-agent-engine-id"


# =========================
# SESSION SERVICE + RUNNER
# =========================
from google.adk.sessions import InMemorySessionService, Session

# Create a simple session to examine its properties
session_service = InMemorySessionService()
# session_service = VertexAiSessionService(
#     project=PROJECT_ID,
#     location=LOCATION,
#     agent_engine_id=AGENT_ENGINE_ID
# )

runner = Runner(
    agent=root_agent,
    app_name=APP_NAME,
    session_service=session_service
)


# =========================
# SESSION RESOLUTION
# =========================

async def resolve_session(
    user_id: str,
    session_id: Optional[str],
    initial_state: Dict[str, Any]
):
    session = None

    # 1. Try fetch using session_id
    if session_id:
        session = await session_service.get_session(
            app_name=APP_NAME,
            user_id=user_id,
            session_id=session_id
        )

   

    # 2. Create new session if none found
    if not session:
        session = await session_service.create_session(
            app_name=APP_NAME,
            user_id=user_id,
            session_id=session_id,  
            state=initial_state,
            # ttl=f"{24 * 60 * 60 * 10}s"
        )

    return session


# =========================
# STATE UPDATE VIA EVENTS
# =========================

async def append_state(
    session,
    payload: Dict[str, Any]
) -> None:
    """
    Persist full payload as state delta
    """

    event = Event(
        invocation_id=str(time.time()),
        author="system",
        actions=EventActions(
            state_delta=payload
        ),
        timestamp=time.time()
    )

    await session_service.append_event(session, event)

#response parsing utility to handle various formats (raw text, JSON blocks, etc.)
def parse_agent_response(text: str) -> Dict[str, Any]:
    """
    Cleans and parses agent response into a dict.
    Handles:
    - ```json ... ``` blocks
    - plain JSON strings
    - extra text around JSON
    """

    if not text:
        return {}

    # 🔹 1. Remove markdown code blocks (```json ... ```)
    text = text.strip()

    code_block_match = re.search(r"```(?:json)?(.*?)```", text, re.DOTALL)
    if code_block_match:
        text = code_block_match.group(1).strip()

    # 🔹 2. Try direct JSON parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # 🔹 3. Try extracting JSON substring (first {...})
    json_match = re.search(r"\{.*\}", text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(0))
        except json.JSONDecodeError:
            pass

    # 🔹 4. Fallback → return raw text
    return {
        "raw_response": text
    }

# =========================
# MAIN RUNNER FUNCTION
# =========================

async def call_leads_agent(
    payload: Dict[str, Any],
    user_id: str
) -> Dict[str, Any]:

    # -------------------------
    # FULL INPUT VALIDATION
    # -------------------------
    try:
        validated_input = AgentInput(**payload)
    except ValidationError as e:
        return AgentOutput(
            response=f"Invalid input payload: {e}",
            session_id=None,
            user_id=payload.get("user_id", user_id),
            author="system",
            state={}
        ).model_dump()

    # Extract validated values
    message: str = validated_input.message
    context: LeadContext = validated_input.context
    session_id: Optional[str] = validated_input.session_id
    user_id: str = validated_input.user_id

   
    # -------------------------
    # SESSION RESOLUTION
    # -------------------------
    # -------------------------

    session = await resolve_session(
        user_id=user_id,
        session_id=session_id,
        initial_state={}
    )

    session_id = session.id

    # -------------------------
    # EXISTING SESSION STATE
    # -------------------------
    existing_state = session.state or {}

    pending = existing_state.get(
        "pending_lead_search",
        {
            "product": "",
            "industries": [],
            "job_roles": []
        }
    )

    # -------------------------
    # BUILD FULL STATE SNAPSHOT
    # -------------------------
    full_state: Dict[str, Any] = {
        **existing_state,
        **validated_input.model_dump(),

        "context": {
            **existing_state.get("context", {}),
            **context.model_dump()
        },

        "pending_lead_search": pending
    }

    # -------------------------
    # STATE UPDATE
    # -------------------------
    await append_state(session, full_state)

    # -------------------------
    # AGENT INPUT (MESSAGE + CONTEXT)
    # -------------------------
    agent_input_payload = {
        "message": message,
        "context": context.model_dump()
    }

    content = types.Content(
        role="user",
        parts=[types.Part(text=json.dumps(agent_input_payload))]
    )

    # -------------------------
    # AGENT INPUT (ONLY MESSAGE)
    # -------------------------
    # content = types.Content(
    #     role="user",
    #     parts=[types.Part(text=message)]
    # )

    final_response: Optional[str] = None
    author: str = "root_agent"

    # -------------------------
    # RUN AGENT
    # -------------------------
    async for event in runner.run_async(
        user_id=user_id,
        session_id=session_id,
        new_message=content
    ):

        if event.is_final_response() and event.content:
            final_response = event.content.parts[0].text
            author = getattr(event, "author", "root_agent")


    final_response=parse_agent_response(final_response) if final_response else ""

    # -------------------------
    # FETCH UPDATED STATE
    # -------------------------
    updated_session = await session_service.get_session(
        app_name=APP_NAME,
        user_id=user_id,
        session_id=session_id
    )

    # -------------------------
    # OUTPUT VALIDATION
    # -------------------------
    try:
        response_obj = AgentOutput(
            response=final_response,
            session_id=session_id,
            user_id=user_id,
            author=author,
            state=updated_session.state if updated_session else {}
        )
    except ValidationError as e:
        error_response = AgentOutput(
            response=f"Output validation failed: {str(e)}",
            session_id=session_id,
            user_id=user_id,
            author="system",
            state={}
        )
        return error_response.model_dump()

    return response_obj.model_dump()


# =========================
# TEST RUN
# =========================

# async def main():

#     payload = {
#         "user_id": "user-123",
#         "message": "Research this lead and suggest outreach strategy",
#         "context": {
#             "name": "John Doe",
#             "email": "john@acme.com",
#             "company_name": "Acme AI",
#             "company_website": "https://acme.com"
#         }
#     }

#     result = await call_leads_agent(payload, payload["user_id"])

#     print("\n🔥 FINAL RESPONSE:\n")
#     print(result)


# if __name__ == "__main__":
#     asyncio.run(main())

