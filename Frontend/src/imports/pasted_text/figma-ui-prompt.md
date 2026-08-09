# Figma UI Design Prompt — AI Sales Outreach Agent

## Project Overview

Design a single-page, production-grade web application called **"Outreach AI"** — an intelligent B2B sales automation platform powered by a multi-agent AI backend. The interface allows sales professionals to research leads, generate hyper-personalized outreach emails, book meetings, and track communication history — all through a conversational AI interface. The design must feel like a premium SaaS tool that sits at the intersection of a CRM, an AI assistant, and an email client. Think Linear meets HubSpot meets Claude — dark, focused, powerful, and elegant.

---

## Design Philosophy & Visual Language

### Aesthetic Direction
Dark premium SaaS. The primary background is a deep near-black (#0D0F12) with subtle warm undertones — not pure black, not gray, but a rich dark charcoal that feels premium. Secondary surfaces sit at (#141720) for cards and panels. Tertiary accents at (#1E2230) for hover states and interactive elements. This palette creates depth and hierarchy without feeling flat.

### Typography
Use **Inter** as the primary typeface throughout. Headlines at 24px/600 weight. Section titles at 16px/500 weight. Body text at 14px/400 weight. Micro labels at 12px/400 weight. Line height 1.6 throughout for readability. Never use font sizes below 11px. The type scale must feel deliberate and editorial — not cluttered.

### Color Accent System
Primary accent: Electric violet — **#7C5CFC** — used for primary CTAs, active states, agent indicators, and key highlights. This is the brand color. Secondary accent: Emerald green — **#22C55E** — used exclusively for success states, email sent confirmations, and positive status indicators. Warning amber: **#F59E0B** — for pending states, awaiting confirmation prompts. Danger red: **#EF4444** — for errors and failed states. All accents appear at full saturation against the dark background for maximum contrast and visual pop.

### Spacing System
Base unit: 4px. All spacing, padding, margins, and gaps must be multiples of 4. Cards use 20px internal padding. Sections use 24px gaps. The overall page uses 24px outer margins. This creates a tight, consistent rhythm throughout the interface.

### Border & Surface System
All cards and panels use 1px borders at rgba(255,255,255,0.06) — barely visible, just enough to separate surfaces from the background. Border radius: 12px for large cards, 8px for inputs and smaller elements, 6px for chips and tags, 20px for pill buttons. No harsh borders. Everything should feel like it floats.

### Shadow & Elevation
Avoid heavy drop shadows. Use subtle inner shadows and very soft outer glows on interactive elements. The primary CTA button should have a soft violet glow (box-shadow: 0 0 20px rgba(124,92,252,0.3)) when hovered. Active chat messages from the AI should have a barely-there left border glow in violet.

---

## Page Layout — Three-Column Structure

The page is divided into three vertical columns on a 1440px wide canvas, full viewport height (100vh), no scrolling on the outer container.

### Column 1 — Left Panel (320px wide, fixed)
**Lead Intelligence Panel** — This is where the user enters lead information and sees intelligence about the lead. This panel is fixed and always visible.

### Column 2 — Center Panel (fills remaining space, ~760px)
**Conversational AI Chat** — The primary workspace. All agent interactions, messages, email previews, and action confirmations happen here.

### Column 3 — Right Panel (320px wide, fixed)
**Action & History Panel** — Shows the generated email preview, follow-up suggestion chips, communication history timeline, and meeting booking status.

A slim top navigation bar (56px height) spans the full width above all three columns.

---

## Top Navigation Bar

Height: 56px. Background: #141720. Bottom border: 1px rgba(255,255,255,0.06).

**Left side:** Logo area — a small violet geometric mark (abstract A or lightning bolt shape) followed by the wordmark "Outreach AI" in 16px/500 Inter. Next to it, a subtle breadcrumb showing "Workspace / Active Session".

**Center:** A session status indicator — a small pulsing green dot followed by "Session Active" text in 12px when a session is live. When no session exists yet, shows a gray dot with "No Session". This dot communicates to the user that their conversation context is being maintained by the backend.

**Right side:** Three icon buttons — Notifications (bell icon with a badge showing count), Settings (gear icon), and a User Avatar (circular, 32px, showing initials or placeholder). The avatar has a subtle violet ring around it when active.

---

## Column 1 — Lead Intelligence Panel (Left, 320px)

### Panel Header
Title: "Lead Context" in 16px/500. A small subtitle below: "AI uses this to personalize outreach" in 12px secondary text. To the right of the title, a small violet badge labeled "Live Context" with a tiny pulsing dot — indicating this data is actively being used by the AI agents.

### Lead Info Form
A clean form with 5 fields, each in a card-style input group with a dark background (#1E2230), 8px radius, 1px subtle border.

**Field 1 — Full Name**
Label: "Lead Name" in 12px uppercase tracking. Input placeholder: "e.g. John Doe". A tiny person icon on the left inside the input. This maps to `context.name` in the backend payload.

**Field 2 — Email Address**
Label: "Email" in 12px uppercase tracking. Input placeholder: "e.g. john@acme.com". An envelope icon on the left. Validation state: when a valid email is typed, a tiny green checkmark appears on the right edge of the input. This maps to `context.email` — critically important as it's the primary key used to look up leads in BigQuery.

**Field 3 — Company Name**
Label: "Company" in 12px uppercase tracking. Input placeholder: "e.g. Zapier". A building icon on the left. Maps to `context.company_name`.

**Field 4 — Company Website**
Label: "Website" in 12px uppercase tracking. Input placeholder: "https://zapier.com". A globe icon on the left. This field is marked "Optional" with a small gray badge. When filled, the AI will trigger the website scraper tool automatically. Maps to `context.company_website`.

**Field 5 — LinkedIn URL**
Label: "LinkedIn" in 12px uppercase tracking. Input placeholder: "linkedin.com/in/...". The LinkedIn icon on the left (use the official shape in gray). Marked "Optional". Maps to `context.linkedin_url`.

### Lead Score Card
Below the form, a card showing an AI-generated Lead Score. Show a circular progress indicator (donut chart style, 80px diameter) with a score like "87" in the center in 24px/600 violet text, and "Lead Score" below in 11px. Around the donut, small labels: "Research Depth", "Personalization", "Engagement Potential" each with a mini bar. This is a premium visual element that makes the tool feel intelligent — even if it's derived from whether context fields are filled.

### Agent Status Indicator
At the bottom of the left panel, a small status card showing which agent is currently active:
- A row with a colored dot and label: "Coordinator" (gray dot, always present)
- Below it: either "Research Agent" (violet dot, pulsing when active) or "Messaging Agent" (emerald dot, pulsing when active)
- Below: a micro text showing the last tool used: "Last tool: scrape_tool" or "Last tool: gmail_tool" etc.
This maps to the `author` field returned in the API response.

---

## Column 2 — Conversational AI Chat (Center)

This is the heart of the interface. Full height minus the top nav. Has two sub-sections: the message thread (scrollable, fills most space) and the input area (fixed at bottom, ~120px).

### Chat Thread Area

**Empty State (first load):**
When no messages exist, show a centered empty state with:
- A large violet gradient abstract orb or geometric shape (think Linear's homepage feel)
- Headline: "Start a conversation" in 20px/500
- Subtext: "Fill in the lead details on the left, then describe what you'd like to do." in 14px secondary
- Three suggestion cards below in a row: "Research this lead", "Generate outreach email", "Check past interactions" — each a clickable pill card that pre-fills the message input

**User Messages:**
Right-aligned. Background: #7C5CFC at 15% opacity, with a 1px violet border. 12px radius. 16px/400 text in near-white. Timestamp below in 11px secondary. Max width 70% of the chat area. No avatar — just the message bubble.

**AI Agent Messages:**
Left-aligned. Background: #1E2230. 12px radius. A small agent avatar on the top-left: a tiny circular icon with the agent initial ("R" for Research Agent in violet, "M" for Messaging Agent in emerald, "C" for Coordinator in gray). Agent name label above the bubble in 11px: "Research Agent" or "Messaging Agent" in the matching accent color. Message text in 14px/400 near-white. Timestamp below in 11px secondary.

**Thinking/Loading State:**
When the AI is processing, show a typing indicator bubble on the left — three animated dots (the classic typing animation) inside a bubble matching the AI message style. Above it, show a small status label that cycles through: "Coordinator routing..." → "Research Agent activated..." → "Scraping website..." → "Analyzing tech stack..." → "Generating response..." — each appearing as a fade-in/fade-out micro animation. This communicates to the user that the multi-agent pipeline is working in the background.

**Personalized Email Preview Card:**
When the backend returns a `personalized_message` in the response, it renders as a special card inside the chat thread — not just as text. This card has:
- A header row with a mail icon and "Personalized Email Draft" label in violet, plus a "Copy" icon button and an "Edit" icon button on the right
- Subject line displayed prominently in 14px/500 below the header
- Email body in 13px/400 with proper line spacing, shown in a slightly lighter background card (#252A3A)
- A bottom action bar with two buttons: "Send Email" (filled violet button with send icon) and "Refine Message" (outlined ghost button)
- A small rationale tag below: a violet pill showing "Why this angle: [rationale text from API]" in 11px italic
This is one of the most important UI elements — make it feel like a real email composer embedded in the chat.

**Meeting Booking Confirmation Card:**
When the agent proposes booking a meeting, show a special card with:
- Calendar icon header with "Meeting Proposal" label
- Meeting details: Title, Date & Time, Duration, Attendee email — each on its own row with an icon
- Two action buttons: "Confirm Booking" (emerald filled) and "Edit Details" (outlined)
- After confirmation, the card transforms to show a success state with the Google Meet link

**Email Sent Confirmation:**
After gmail_tool fires successfully, show a success toast/banner inside the chat thread (not a popup):
- Green checkmark icon
- "Email sent successfully" in 14px/500 emerald
- Message ID shown in 11px mono font below
- "View in Gmail" link in violet

### Chat Input Area (Fixed Bottom)

A fixed bar at the bottom of the center column. Background: #141720. Top border: 1px rgba(255,255,255,0.06). 20px padding.

The input itself is a large multi-line text area — dark background (#1E2230), 12px radius, no hard border (just the subtle rgba border), 14px text, placeholder: "Ask the agent to research, write an email, book a meeting...". Auto-expands up to 4 lines, then scrolls.

Below the input, a row with:
- Left side: Three quick-action icon buttons — Attach (paperclip), History (clock icon, clicking shows history panel), Clear (X icon to clear context)
- Right side: A "Send" button — violet filled, 36px height, 16px horizontal padding, with a send arrow icon. Disabled state when input is empty (opacity 0.4). Active state has the violet glow.

Below the quick actions, a micro row of **Suggestion Chips** — horizontal scrollable row of small pill buttons showing the `follow_up_recommendations` from the last API response. Each chip is a ghost pill (transparent background, violet border, violet text, 6px radius). When clicked, it pre-fills the message input with that suggestion text. This is critical — it directly maps to `follow_up_recommendations` array from the backend.

---

## Column 3 — Action & History Panel (Right, 320px)

### Panel Header
Title: "Actions & History" in 16px/500. A tab switcher below with two tabs: "Actions" and "History" — violet underline on active tab.

### Actions Tab

**Current Email Draft Section:**
If `personalized_message` is present in the last response, show a compact preview card here too — truncated to 3 lines with a "View Full" link. Below it, two action buttons stacked vertically:
- "Send This Email" — violet filled, full width, with envelope icon
- "Book a Meeting" — outlined ghost button, full width, with calendar icon

**Pending Confirmations:**
If the agent is awaiting user confirmation (which the messaging agent always requires before sending), show a prominent amber warning card:
- Amber left border
- "Awaiting Your Approval" in 13px/500 amber
- "The agent is ready to send an email to john@acme.com" in 12px secondary
- "Approve" and "Decline" buttons

**Quick Actions Grid:**
A 2x2 grid of small action cards (each ~130px wide, ~80px tall):
- "Research Lead" (magnifier icon, violet)
- "Generate Email" (pen icon, violet)
- "Book Meeting" (calendar icon, emerald)
- "View History" (clock icon, gray)
Each card has an icon, a label, and a subtle hover state (background lightens slightly).

### History Tab

A vertical timeline of past communications for the current lead, pulled from `communication_logs` in BigQuery via `history_tool`.

Each timeline item has:
- A left vertical line connecting all items (1px rgba(255,255,255,0.1))
- A dot on the line: green dot for successful email, emerald dot for meeting, red dot for failed
- Type badge: "Email" or "Meeting" pill in matching color
- Date/time in 11px secondary
- For emails: Subject line in 13px/500, truncated. Status badge: "Sent" in green or "Failed" in red
- For meetings: Meeting title in 13px/500. Duration + Meet link
- A subtle ">" chevron on hover to expand details

Empty state for history: A centered illustration (simple calendar + envelope icons in gray) with text "No interactions yet. Start by sending an outreach email."

---

## Micro-interactions & States

### Session ID Management (Critical Backend Requirement)
The frontend must store `session_id` from the first API response and send it back on every subsequent request. Show this visually in the top nav: when the first response arrives, the session indicator animates from gray "No Session" to green pulsing "Session Active — #session-001". This tells the user their conversation context is being maintained. Add a small tooltip on hover: "Your conversation history is being preserved across messages."

### Flag State Visual
The `flag` field from the backend (0, 1, 2) should be shown as a subtle status badge near the email draft:
- flag=0: Gray badge "Drafting"
- flag=1: Violet badge "Ready to Send"  
- flag=2: Green badge "Sent"

### Agent Handoff Animation
When the coordinator routes from research_agent to messaging_agent, show a brief transition in the chat: a small system message bubble (centered, no avatar, different style) saying "Handing off to Messaging Agent..." with a subtle animated arrow. This makes the multi-agent architecture visible and impressive to users.

### Tool Usage Indicator
When the backend is using `scrape_tool` or `tech_tool`, show a progress indicator inside the thinking bubble: a small row of tool pills that light up one by one — "Scraping website..." → "Analyzing tech stack..." → "Building personalization...". This turns the wait time into a visible AI process, making it feel powerful rather than just loading.

### Responsive Input States
- Input focused: border glows violet (box-shadow: 0 0 0 2px rgba(124,92,252,0.4))
- Input with content: border stays violet at lower opacity
- Input disabled: opacity 0.5, no interaction
- Send button hover: violet glow effect
- Send button loading: spinner replaces arrow icon

---

## Component Library to Define in Figma

Create the following as reusable components with variants:

**Button:** Primary (violet filled), Secondary (outlined ghost), Danger (red filled), Success (emerald filled). States: Default, Hover, Active, Disabled, Loading.

**Input Field:** Default, Focused, Error, Success, Disabled. With and without left icon.

**Chat Bubble:** User variant, AI Agent variant (with sub-variants for Research Agent, Messaging Agent, Coordinator), System Message variant, Loading/Typing variant.

**Special Cards:** Email Draft Card, Meeting Proposal Card, Confirmation Card, History Timeline Item.

**Chips/Pills:** Suggestion Chip (ghost violet), Status Badge (gray/violet/green/amber/red), Agent Badge, Tool Badge.

**Status Indicators:** Session Active dot, Agent Active dot, Tool Running dot — all with pulsing animation documented.

**Toast/Notification:** Success (green), Error (red), Warning (amber), Info (violet).

---

## Figma File Organization

### Pages
1. **Cover** — Project title, team info, version
2. **Design System** — Colors, typography, spacing, icons, component library
3. **Main UI** — The full 1440px single-page interface, all three states: Empty, Active Session, Email Generated
4. **Components** — All reusable components with variants
5. **Mobile (optional)** — 390px responsive version if time permits

### Frames to Include on Main UI Page
- **State 1: Empty/Onboarding** — No lead entered, no messages, empty state shown
- **State 2: Research Active** — Lead info filled, agent thinking animation, research response shown
- **State 3: Email Generated** — Full email draft card in chat, suggestion chips showing, right panel with actions
- **State 4: Awaiting Approval** — Messaging agent showing email preview with approve/decline
- **State 5: Email Sent** — Success confirmation, history updated with the sent email

---

## Key UX Principles to Follow

**1. The AI does the work, the human approves.** Every irreversible action (sending email, booking meeting) must have a clear confirmation step visible in the UI. This matches your backend's `messaging_agent` prompt which explicitly requires confirmation before firing `gmail_tool` or `calendar_tool`.

**2. Context is always visible.** The lead info panel is always open on the left — the user can see at a glance what context the AI is working with. If they update a field, a subtle "Context Updated" toast appears and the AI is informed.

**3. Session continuity is communicated.** The user should always know their conversation is being maintained. The session indicator in the top nav and the chat thread history both communicate this. The `session_id` from the backend is stored in browser memory and resent on every request.

**4. Multi-agent architecture is visible.** Don't hide the fact that there are multiple agents. Show which agent is responding with the agent badge on each message. Show the coordinator routing. Show the tool being used. This is a feature, not an implementation detail — it makes the product feel sophisticated.

**5. The email is the product.** The generated `personalized_message` is the most valuable output of the entire system. It should be the most visually prominent element when present — rendered as a real email card, not just text in a chat bubble.
