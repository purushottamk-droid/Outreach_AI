from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from typing import Any, Dict, Optional, List, Union

# =========================

# LEAD CONTEXT

# =========================

class LeadContext(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    name: Optional[str] = Field(
        default=None,
        description="Full name of the lead."
    )

    email: Optional[str] = Field(
        default=None,
        description="Primary email address of the lead."
    )

    linkedin_url: Optional[str] = Field(
        default=None,
        description="LinkedIn profile URL."
    )

    company_name: Optional[str] = Field(
        default=None,
        description="Company name."
    )

    company_website: Optional[str] = Field(
        default=None,
        description="Official company website."
    )
    
    company_summary: Optional[str] = Field(
        default=None,
        description="Company summary from database."
    )

    tech_stack: Optional[str] = Field(
        default=None,
        description="Tech stack JSON string from database."
    )

# =========================

# AGENT INPUT

# =========================

class AgentInput(BaseModel):


    model_config = ConfigDict(from_attributes=True)

    user_id: str = Field(
        ...,
        description="Unique user identifier."
    )

    session_id: str = Field(
        ...,
        description="Conversation session identifier."
    )

    message: str = Field(
        ...,
        description="User message."
    )

    flag: int = Field(
        ...,
        description="Workflow state flag."
    )

    context: LeadContext = Field(
        ...,
        description="Lead and company context."
    )


# =========================

# RESEARCH AGENT OUTPUT

# =========================

class ResearchAgentOutput(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    personalized_message: Optional[str] = Field(
        default=None,
        description="Generated personalized outreach message."
    )

    agent_response: str = Field(
        ...,
        description="Primary conversational response."
    )

    follow_up_recommendations: Optional[List[str]] = Field(
        default=None,
        description="Suggested follow-up questions."
    )

    rationale: Optional[str] = Field(
        default=None,
        description="Reasoning behind generated outreach."
    )

    

# =========================

# AGENT OUTPUT

# =========================

class AgentOutput(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    response: Optional[Union[str, Dict[str, Any]]] = Field(
        default=None,
        description="Agent response payload."
    )

    session_id: Optional[str] = Field(
        default=None,
        description="Session identifier."
    )

    user_id: str = Field(
        ...,
        description="User identifier."
    )

    author: str = Field(
        ...,
        description="Authoring agent."
    )

    state: Dict[str, Any] = Field(
        default_factory=dict,
        description="Updated session state."
    )

    

# =========================

# USER PROFILE

# =========================

class UserProfile(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    user_id: str

    name: Optional[str] = None

    email: Optional[str] = None

    company: Optional[str] = None

    product_service: Optional[str] = None

    target_industries: Optional[List[str]] = Field(
        default_factory=list,
        max_length=3
)

    target_roles: Optional[List[str]] = Field(
        default_factory=list,
        max_length=4
    )

    target_size: Optional[str] = None

    geography: Optional[str] = None

    created_at: Optional[datetime] = None

    updated_at: Optional[datetime] = None

    


# =========================

# LEAD SEARCH REQUEST

# =========================

class LeadSearchRequest(BaseModel):


    model_config = ConfigDict(from_attributes=True)

    user_id: str

    industries: Optional[List[str]] = Field(
        default_factory=list,
        max_length=3
    )

    job_roles: Optional[List[str]] = Field(
        default_factory=list,
        max_length=4
    )

    company_size: Optional[str] = None

    geography: Optional[str] = None

    limit: Optional[int] = Field(
        default=20,
        ge=1,
        le=100,
        description="Maximum number of leads to return."
)


# =========================

# LEAD RESULT

# =========================

class LeadResult(BaseModel):


    model_config = ConfigDict(from_attributes=True)

    id: Optional[str] = None

    name: Optional[str] = None

    email: Optional[str] = None

    phone: Optional[str] = None

    company: Optional[str] = None

    company_website: Optional[str] = None

    job_role: Optional[str] = None

    designation: Optional[str] = None

    industry: Optional[str] = None

    company_size: Optional[str] = None

    geography: Optional[str] = None

    linkedin_url: Optional[str] = None

    company_summary: Optional[str] = None

    tech_stack: Optional[str] = None

    lead_status: Optional[str] = None

    enriched_at: Optional[datetime] = None
    
    why_this_lead: Optional[List[str]] = Field(
        default_factory=list,
        description="Reasons why this lead matches the user's ICP."
)
    

# =========================

# LEAD SEARCH RESPONSE

# =========================

class LeadSearchResponse(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    leads: List[LeadResult] = Field(
        default_factory=list
    )

    total_count: Optional[int] = None

    criteria: Optional[str] = None

    

# =========================

# BULK EMAIL REQUEST

# =========================

class BulkEmailRequest(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    user_id: str

    campaign_id: Optional[str] = None

    lead_ids: List[str] = Field(
        default_factory=list
    )

    email_subject: Optional[str] = None

    email_body: Optional[str] = None

    rationale: Optional[str] = None


# =========================

# BULK EMAIL RESPONSE

# =========================

class BulkEmailResponse(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    sent: Optional[int] = 0

    failed: Optional[int] = 0

    details: Optional[List[dict]] = Field(
        default_factory=list
    )

    
    

# =========================

# CAMPAIGN CREATE

# =========================

class CampaignCreate(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    user_id: str

    name: Optional[str] = None

    target_criteria: Optional[dict] = Field(
        default_factory=dict
    )

    lead_ids: List[str] = Field(
        default_factory=list
    )

# =========================

# CAMPAIGN RESPONSE

# =========================

class CampaignResponse(BaseModel):


    model_config = ConfigDict(from_attributes=True)

    campaign_id: Optional[str] = None

    user_id: Optional[str] = None

    name: Optional[str] = None

    target_criteria: Optional[dict] = Field(
        default_factory=dict
    )

    status: Optional[str] = None

    lead_count: Optional[int] = 0

    emails_sent: Optional[int] = 0

    replies_received: Optional[int] = 0

    meetings_booked: Optional[int] = 0

    completed_steps: Optional[int] = 0

    created_at: Optional[datetime] = None

    

# =========================

# FOLLOWUP CONFIG

# =========================

class FollowupConfig(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    config_id: Optional[str] = None

    user_id: Optional[str] = None

    campaign_id: Optional[str] = None

    followup_1_days: Optional[int] = 3

    followup_2_days: Optional[int] = 7

    followup_3_days: Optional[int] = 14

    max_followups: Optional[int] = 3

    llm_recommended: Optional[bool] = False

    


# =========================

# FOLLOWUP RECOMMEND REQUEST

# =========================

class FollowupRecommendRequest(BaseModel):


    model_config = ConfigDict(from_attributes=True)

    user_id: str

    campaign_id: Optional[str] = None

    industry: Optional[str] = None


# =========================

# FOLLOWUP RECOMMEND RESPONSE

# =========================

class FollowupRecommendResponse(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    followup_1_days: Optional[int] = None

    followup_2_days: Optional[int] = None

    followup_3_days: Optional[int] = None

    rationale: Optional[str] = None

    

# =========================

# PENDING APPROVAL

# =========================

class PendingApproval(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    approval_id: Optional[str] = None

    user_id: Optional[str] = None

    campaign_id: Optional[str] = None

    lead_id: Optional[str] = None

    lead_name: Optional[str] = None

    lead_email: Optional[str] = None

    followup_number: Optional[int] = None

    total_followups: Optional[int] = None

    email_subject: Optional[str] = None

    email_body: Optional[str] = None

    scheduled_time: Optional[datetime] = None

    status: Optional[str] = None

    created_at: Optional[datetime] = None

    

# =========================

# APPROVAL ACTION

# =========================

class ApprovalAction(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    approval_id: str

    user_id: str

# =========================

# NOTIFICATION

# =========================

class Notification(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    notification_id: Optional[str] = None

    user_id: Optional[str] = None

    type: Optional[str] = Field(
        default=None,
        description="followup | reply | meeting | error"
    )

    title: Optional[str] = None

    subtitle: Optional[str] = None

    time: Optional[str] = None

    action: Optional[str] = None

    read: Optional[bool] = False
    email_body: Optional[str] = None
    email_subject: Optional[str] = None
    lead_email: Optional[str] = None
    lead_name: Optional[str] = None
    meeting_date: Optional[str] = None
    duration: Optional[int] = None

    

# =========================

# HISTORY ITEM

# =========================

class HistoryItem(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    id: Optional[str] = None

    lead_id: Optional[str] = None

    type: Optional[str] = Field(
        default=None,
        description="email | meeting | reply"
    )

    direction: Optional[str] = Field(
        default=None,
        description="inbound | outbound"
    )

    status: Optional[str] = None

    to_email: Optional[str] = None

    subject: Optional[str] = None

    body: Optional[str] = None

    message_id: Optional[str] = None

    followup_number: Optional[int] = None

    reply_text: Optional[str] = None

    reply_classification: Optional[str] = None

    summary: Optional[str] = None

    start_time: Optional[datetime] = None

    end_time: Optional[datetime] = None

    event_link: Optional[str] = None

    created_at: Optional[datetime] = None

    

# =========================

# WEBSOCKET MESSAGE

# =========================

class WebSocketMessage(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    type: Optional[str] = None

    data: Optional[dict] = Field(
        default_factory=dict
    )

    user_id: Optional[str] = None

    timestamp: Optional[str] = None

    
