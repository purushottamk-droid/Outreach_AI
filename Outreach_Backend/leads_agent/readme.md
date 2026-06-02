# 🚀 Leads Agent System (ADK + Gemini)

A multi-agent system built using Google ADK (Agent Development Kit) and Gemini models to automate:

- Lead research  
- Personalized outreach generation  
- Email sending via Gmail API  
- Meeting booking via Google Calendar  
- Communication tracking via BigQuery  

---

## 🧠 Architecture Overview

```
                ┌──────────────────────┐
                │     Coordinator      │
                │   (Root LLM Agent)   │
                └─────────┬────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
┌──────────────────────┐        ┌──────────────────────────┐
│  Research Agent      │        │ Messaging & Booking Agent│
│ (Lead Intelligence)  │        │ (Execution Layer)        │
└──────────────────────┘        └──────────────────────────┘
        │                                   │
        │                                   │
   ┌───────────────┐         ┌────────────────────────────┐
   │ scrape_tool   │         │ gmail_tool                 │
   │               │         │ calendar_tool              │
   │               │         │ history_tool               │
   └───────────────┘         └────────────────────────────┘
```

---

## 📦 Core Components

### 1. 🧩 Coordinator Agent (Root)

**Role:**
- Routes user requests  
- Decides whether to:
  - Research lead  
  - Send email  
  - Book meeting  
  - Fetch history  

```python
coordinator = LlmAgent(
    name="Coordinator",
    model="gemini-2.5-flash",
    description="Routes tasks between research and messaging agents",
    instruction=instruction,
    sub_agents=[
        research_agent,
        messaging_booking_agent
    ]
)
```

---

### 2. 🔍 Research Agent

**Purpose:**
- Analyze lead + company  
- Scrape website  
- Generate:
  - Personalized outreach message  
  - Insights  
  - Follow-up questions  

```python
research_agent = LlmAgent(
    model="gemini-2.5-flash",
    name="lead_research_agent",
    output_schema=ResearchAgentOutput,
    output_key="research_output",
    instruction=instruction,
    tools=[scrape_tool]
)
```

---

### 3. 💬 Messaging & Booking Agent

**Purpose:**
- Send emails  
- Schedule meetings  
- Check past communications  

```python
messaging_booking_agent = LlmAgent(
    model="gemini-2.5-flash",
    name="messaging_booking_agent",
    output_key="messaging_booking_output",
    instruction=instruction,
    tools=[gmail_tool, calendar_tool, history_tool]
)
```

---

## 🛠️ Tools

### 🌐 Website Scraper

```python
scrape_tool = FunctionTool(func=scrape_website)
```

Extracts:
- Title  
- Content  
- Links  

---

### 📧 Gmail Tool

Features:
- Sends email via Gmail API  
- OAuth via Secret Manager  
- Logs to BigQuery  
- Token auto-refresh  

---

### 📅 Calendar Tool

Features:
- Books Google Meet events  
- Adds attendees  
- Timezone aware (Asia/Kolkata)  
- Logs to DB  

---

### 📜 History Tool

```python
history_tool = FunctionTool(func=get_recent_communications)
```

---

## 🗄️ Data Layer (BigQuery)

### leads

| Field | Type |
|------|------|
| id | UUID |
| name | TEXT |
| email | TEXT |
| company | TEXT |
| status | TEXT |

### communication_logs

| Field | Type |
|------|------|
| id | UUID |
| lead_id | UUID |
| type | email / meeting |
| status | success / failed |
| subject | TEXT |
| message_id | TEXT |
| event_link | TEXT |
| error_message | TEXT |
| created_at | TIMESTAMP |

---

## 🔐 Secrets Management

Stored in Google Secret Manager:
- gmail-api-credentials  
- google-calendar-credentials  

Access via:
```python
get_secret(secret_id)
```

---

## 🧾 Input Schema

```python
class LeadContext(BaseModel):
    name: Optional[str]
    email: Optional[str]
    linkedin_url: Optional[str]
    company_name: Optional[str]
    company_website: Optional[str]

class AgentInput(BaseModel):
    user_id: str
    session_id: Optional[str]
    message: str
    context: LeadContext
```

---

## 📤 Output Schema

```python
class AgentOutput(BaseModel):
    response: str
    session_id: str
    user_id: str
    author: str
    state: Dict[str, Any]
```

---

## ⚙️ Runner Flow

Responsibilities:
- Validate input  
- Resolve session  
- Store payload in state  
- Trigger agent  
- Return structured response  

---

## 📌 Example Payload

```json
{
  "message": "Research this lead and suggest outreach strategy",
  "context": {
    "name": "John Doe",
    "email": "john@acme.com",
    "company_name": "Acme AI",
    "company_website": "https://acme.com"
  }
}
```

---

## 📌 Example Response

```json
{
  "response": "Here's a personalized outreach strategy...",
  "session_id": "abc123",
  "user_id": "user-123",
  "author": "lead_research_agent",
  "state": {
    "research_output": {}
  }
}
```

---

## 🧠 Design Principles

- Separation of Concerns  
- Event-Sourced State  
- Tool-Driven Execution  
- Progressive Personalization  

---

## ⚠️ Known Limitations

- output_schema + tools conflicts  
- No token persistence  
- No rate limiting  
- Basic scraper (no JS rendering)  

---

## 🔥 Future Improvements

- Redis caching  
- Retry queue  
- Playwright scraping  
- Analytics dashboard  
- OAuth persistence  

---

## 🧪 Running the System

```bash
python runner.py
```

---

## 💡 Final Thought

This system is essentially a mini autonomous sales assistant:

- Thinks → LLM agents  
- Acts → Tools  
- Remembers → Session state  
- Learns → Structured inputs  
