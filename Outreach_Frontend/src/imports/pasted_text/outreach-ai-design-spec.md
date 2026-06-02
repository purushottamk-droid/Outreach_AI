OUTREACH AI
Complete Figma Design Prompt
V1 (Original) + V2 (New Requirements)
Pass this entire document to Figma AI or any designer

PART 1 — DESIGN SYSTEM  (Same as V1 — Do Not Change)


Design Philosophy & Visual Language
Dark premium SaaS. The primary background is a deep near-black (#0D0F12) with subtle warm undertones — not pure black, not gray, but a rich dark charcoal that feels premium. Secondary surfaces sit at (#141720) for cards and panels. Tertiary accents at (#1E2230) for hover states and interactive elements.
Typography
Primary typeface: Inter throughout
Headlines: 24px / 600 weight
Section titles: 16px / 500 weight
Body text: 14px / 400 weight
Micro labels: 12px / 400 weight
Line height 1.6 throughout. Never below 11px.
Color Accent System
Primary accent — Electric violet: #7C5CFC — CTAs, active states, agent indicators, highlights
Secondary accent — Emerald green: #22C55E — success states, email sent, positive status
Warning amber: #F59E0B — pending states, awaiting confirmation
Danger red: #EF4444 — errors and failed states
Spacing System
Base unit: 4px. All spacing must be multiples of 4
Cards: 20px internal padding
Sections: 24px gaps
Page outer margins: 24px
Border & Surface System
All cards / panels: 1px border at rgba(255,255,255,0.06)
Border radius: 12px large cards, 8px inputs/small elements, 6px chips/tags, 20px pill buttons
No harsh borders — everything floats
Shadow & Elevation
Avoid heavy drop shadows — use subtle inner shadows and soft outer glows
Primary CTA: box-shadow: 0 0 20px rgba(124,92,252,0.3) on hover
AI messages: barely-there left border glow in violet


PART 2 — V1 PAGE LAYOUT  (Keep As-Is)


Page Layout — Three-Column Structure
1440px wide canvas. Full viewport height (100vh). No outer scrolling. Three fixed vertical columns.
Column 1 — Left Panel: 320px wide, fixed — Lead Intelligence Panel
Column 2 — Center Panel: fills remaining ~760px — Conversational AI Chat
Column 3 — Right Panel: 320px wide, fixed — Action & History Panel
Top Navigation Bar: 56px height, spans full width above all columns

Top Navigation Bar (56px)
Background: #141720. Bottom border: 1px rgba(255,255,255,0.06)
Left: Logo (violet geometric mark) + 'Outreach AI' wordmark 16px/500 + breadcrumb 'Workspace / Active Session'
Center: Session status — pulsing green dot + 'Session Active — #session-id' or gray dot 'No Session'
Right: Bell icon (with badge count) + Settings gear + User Avatar 32px (circular, violet ring when active)

Column 1 — Lead Intelligence Panel (V1 Fields)
Header: 'Lead Context' 16px/500 + subtitle 'AI uses this to personalize outreach' 12px + 'Live Context' violet pulsing badge.
Field 1 — Lead Name: person icon, placeholder 'e.g. John Doe', maps to context.name — REQUIRED (*)
Field 2 — Email: envelope icon, green checkmark on valid email, maps to context.email — REQUIRED (*)
Field 3 — Company: building icon, maps to context.company_name — REQUIRED (*)
Field 4 — Website: globe icon, 'Optional' badge, triggers website scraper — REQUIRED (*)
Field 5 — LinkedIn: LinkedIn icon, 'Optional' badge, maps to context.linkedin_url
Lead Score Card: donut chart 80px, score 0–100 in violet, bars for Research Depth / Personalization / Engagement
Agent Status: dots for Coordinator (gray) / Research Agent (violet pulsing) / Messaging Agent (emerald pulsing)

Column 2 — Chat Panel (V1 Elements)
Empty state: violet gradient orb + 'Start a conversation' + 3 suggestion cards
User messages: right-aligned, violet 15% opacity bubble, 14px text, timestamp
AI agent messages: left-aligned, agent badge (R/M/C initial), colored border, agent name label
Typing indicator: 3 animated dots + cycling stage label (Coordinator routing → Scraping website → etc.)
Email Draft Card: mail icon header, subject, body in darker card, Send Email + Refine buttons, rationale pill
Meeting Booking Card: calendar icon header, meeting details rows, Confirm + Edit buttons
Email Sent Banner: green checkmark + 'Email sent successfully' + View in Gmail link
System messages: centered pill with arrow icon

Column 3 — Actions & History Panel (V1 Elements)
Header: 'Actions & History' 16px/500 + tabs: Actions | History (violet underline on active)
Actions tab: Email draft preview card + Send/Book buttons + Pending approval amber card + Quick actions 2x2 grid
Quick actions grid: Research Lead (violet) / Generate Email (violet) / Book Meeting (emerald) / View History (gray)
History tab: vertical timeline, colored dots, Email/Meeting type badges, date/time, chevron expand
History empty state: gray mail + calendar icons + 'No interactions yet'


PART 3 — V2 NEW COMPONENTS  (Add These to Existing Design)


New Screen: Onboarding / User Profile Setup
Shown only on first visit or when user has no profile. Full-screen overlay on top of the main layout. Two-step wizard.

Onboarding Screen Spec
Background: #0D0F12 full screen with violet radial gradient at top center (subtle)
Card: centered, 560px wide, background #141720, border 1px rgba(255,255,255,0.08), radius 20px, padding 40px

Step indicator: '1 of 2' in top right, two violet dots connected by line

STEP 1 — Your Profile:
  Title: 'Tell us about yourself' 24px/600
  Subtitle: 'We use this to personalize your outreach strategy' 14px secondary
  Fields: Your Name, Your Email, Your Company, What you sell (textarea)
  Each field: dark input #1E2230, left icon, same style as main Lead Panel

STEP 2 — Your Target:
  Title: 'Who are you targeting?' 24px/600
  Fields:
    Target Industry — dropdown: SaaS / Fintech / Healthcare / eCommerce / Other
    Target Job Role — dropdown: CTO / VP Sales / Founder / Marketing Head / Other
    Target Company Size — radio pills: 1-50 / 50-200 / 200-1000 / 1000+
    Geography — text input, optional

  Bottom row:
    'Skip for now' — ghost text link (gray)
    'Continue to Dashboard →' — violet filled pill button


New Component: Lead Discovery Search Bar (Left Panel — V2 Mode)
When user is in 'Find Leads' mode, the Left Panel switches from manual entry to a search criteria view. Toggle between modes via a tab at the top of the left panel.

Left Panel — V2 Mode Spec
Tab switcher at top of left panel:
  [ Manual Entry ]  [ Find Leads ]   ← violet underline on active

Find Leads mode shows:
  Industry input (pre-filled from onboarding profile)
  Job Role input (pre-filled)
  Company Size pills (same radio style as onboarding)
  Geography input (optional)
  Limit slider: '10 leads' ←→ '50 leads' (violet range slider)

Bottom of search form:
  Lead count preview badge: '~247 leads match your criteria' in violet
  'Find Leads' button — full width, violet filled, with search icon
  Loading state: spinner + 'Searching database...' text


New Message Type: Lead List Card (Chat Panel — V2)
When the agent finds multiple leads, they appear as a special card inside the chat thread — NOT as plain text. This is the most important new UI component in V2.

Lead List Card Spec
Outer wrapper:
  Background: #141720
  Border: 1px solid rgba(255,255,255,0.08), radius 14px
  Padding: 0 (inner cards have own padding)

Header row (inside wrapper, 14px padding):
  Left: search icon (violet) + 'Found 18 Leads' in 14px/500 violet
  Right: 'Select All' checkbox + count badge '0 selected'
  Subtitle: 'Matching: CTOs in Fintech · USA · 50-200 employees' in 11px gray

Scrollable lead list (max height 400px, scrollable):
  Each lead card row (48px height, border-bottom 1px rgba(255,255,255,0.05)):

    [ checkbox ]  [ avatar 32px ]  [ name + title ]  [ company ]  [ status badge ]  [ > ]

    Checkbox: dark, violet when checked
    Avatar: 32px circle, initials, violet/emerald/amber gradient based on status
    Name: 13px/500 #F0F1F5
    Title/Designation: 11px rgba(255,255,255,0.5) below name
    Company: 12px violet (right of name column)
    Status badge: pill — 'New' gray / 'Contacted' amber / 'Replied' emerald / 'Cold' red
    Chevron: right-aligned, rotates when expanded

  Expanded lead row (click chevron):
    Shows: Email (with copy icon), Phone, LinkedIn link
    Company summary: 2 lines truncated, 'Read more' link
    Tech stack chips: small gray pills (React, HubSpot, etc.)
    'View Full Profile' violet link → opens side modal

Footer (sticky bottom of card):
  Left: '3 leads selected'
  Right: 'Generate Emails for Selected →' — violet filled button
         'Send Emails Now' — only shown after emails generated


New Component: Lead Full Profile Modal
Slides in from right side when user clicks 'View Full Profile'. Overlays the right panel area.

Lead Profile Modal Spec
Width: 360px, slides in from right (animation: translateX)
Background: #141720, left border: 1px rgba(255,255,255,0.08)
Header: lead name 18px/600 + close X button + status badge

Sections (scrollable):
  Contact Info block:
    Email row: envelope icon + email + copy button
    Phone row: phone icon + phone (if available)
    LinkedIn row: LinkedIn icon + link
    Company row: building icon + company name

  Company Intelligence block:
    Title: 'Company Intelligence' 12px uppercase gray
    Company summary: paragraph from pre-scraped data
    Tech stack: colored chips (violet for frontend, green for analytics, amber for CRM)
    'Enriching...' shimmer animation if data not yet scraped

  Interaction History block:
    Title: 'Past Interactions' 12px uppercase gray
    Same timeline style as history panel
    Each item: date+time shown (not just 'Today')
    Lead reply shown as incoming bubble in thread
    Reply classification badge: 'POSITIVE' green / 'NEUTRAL' amber / 'NO REPLY' gray


New Message Type: Bulk Email Approval Card (Chat Panel — V2)
Before bulk emails are sent, this card appears in the chat thread requiring explicit approval. Connects to messaging_agent confirmation flow.

Bulk Email Approval Card Spec
Background: rgba(124,92,252,0.07)
Border: 1px rgba(124,92,252,0.25), left border 3px #7C5CFC
Border radius: 12px, padding: 20px

Header:
  Left: mail icon + 'Ready to Send to 15 Leads' 15px/500 violet
  Right: flag badge 'Ready to Send' (violet pill)
  Subtitle: 'AI has personalized each email. Review before sending.' 12px gray

Lead preview list (3 rows, 'Show all 15' link):
  Each row: avatar 24px + name + email truncated + 'Preview ↗' violet link
  Dividers: 1px rgba(255,255,255,0.04)

Email subject preview:
  Label: 'SUBJECT TEMPLATE' 11px uppercase gray
  Value: subject line in #252A3A card, 13px

Rationale pill:
  '💡 Why this angle: [rationale text]' — violet italic pill

Action row:
  'Approve & Send All' — full green filled button (#22C55E)
  'Review Each First' — outlined ghost button
  'Cancel' — text link in red

Progress state (after approve — replaces action row):
  Progress bar: violet fill, '12 / 15 sent...'
  After complete: green checkmark + 'All 15 emails sent successfully'


New Component: Follow-up Configuration Panel (Right Panel — Campaigns Tab)
Add a third tab to the right panel: 'Campaigns'. This tab contains the follow-up scheduler configuration.

Right Panel — Campaigns Tab Spec
Tab row: Actions | History | Campaigns  (three tabs, same violet underline style)

CAMPAIGNS TAB CONTENT:

Active Campaign card:
  Background: #141720, border 1px rgba(255,255,255,0.06), radius 12px, padding 14px
  Title: 'Q2 Fintech Outreach' 14px/500
  Stats row: '18 leads · 15 contacted · 3 replied · 1 meeting'
  Status: 'Active' green pill

Follow-up Timeline Visualizer:
  Title: 'Follow-up Sequence' 12px uppercase gray
  Horizontal timeline strip:

  Day 0     Day 3     Day 7     Day 14
    ●─────────●─────────●──────────●
  Initial  FU #1     FU #2      Final

  Each dot:
    32px circle, violet border 2px
    Completed: filled violet, white checkmark inside
    Pending: outlined violet, day number inside
    Day label above dot in 10px gray
    Email type label below: 'Initial' / 'Follow-up 1' / 'Follow-up 2' / 'Final'

  Each segment line:
    Dashed line rgba(124,92,252,0.3) connecting dots
    Completed segments: solid violet

  Below timeline — editable day inputs:
    'Days after initial:' label + small number input per step
    e.g. FU#1: [3] days  FU#2: [7] days  Final: [14] days

  LLM suggestion row:
    '🤖 Ask LLM to recommend intervals' — outlined violet button
    When clicked: shows LLM suggestion in amber info box
    User can accept or override

  Save button: 'Save Configuration' — full width violet

Default timing note:
  'Default: 3 / 7 / 14 days. Industry standard for B2B outreach.' 11px gray italic


New Message Type: Follow-up Pending Approval Card (Chat Panel — V2)
When a scheduled follow-up is due, this card appears in chat requiring user approval before the email sends.

Follow-up Pending Card Spec
Background: rgba(245,158,11,0.06)
Border: 1px rgba(245,158,11,0.2), left border 3px #F59E0B
Border radius: 10px, padding: 16px

Header:
  Clock icon (amber) + 'Follow-up Ready' 14px/500 amber
  Subtitle: 'No reply received in 3 days from John Doe · john@acme.com'

Email preview (collapsed by default, expand on click):
  'Follow-up #1 of 3' badge
  Subject: shown in 13px/500
  Body preview: 2 lines truncated, 'Expand' link

Timing info row:
  'Scheduled for: Today at 10:00 AM IST'
  'Campaign: Q2 Fintech Outreach'

Action row:
  'Approve & Send' — filled amber button (#F59E0B, dark text)
  'Edit Email' — outlined ghost
  'Skip this lead' — text link gray


New Message Type: Reply Received Card (Chat Panel — V2)
When a lead replies to an outreach email, the reply is shown as a special card with LLM classification.

Reply Received Card Spec
Background: determined by classification:
  POSITIVE → rgba(34,197,94,0.07), border #22C55E
  NEUTRAL  → rgba(245,158,11,0.07), border #F59E0B
  NEGATIVE → rgba(239,68,68,0.07), border #EF4444

Header row:
  Lead avatar 32px + 'Reply from John Doe' 13px/500
  Classification badge: 'POSITIVE' in matching color, bold
  Timestamp: date + time (e.g. 'May 15, 2026 · 2:34 PM')

Email content block:
  Lead's reply text in slightly lighter card #252A3A
  Font: 13px/400, line height 1.7

LLM Action Suggestion row:
  Brain/lightning icon + 'LLM suggests:' label
  POSITIVE: 'Lead is ready to talk. Book a meeting.' — emerald text
  NEUTRAL:  'Lead wants contact in 30 days. Schedule re-engagement.' — amber
  NEGATIVE: 'Lead not interested. Mark as closed.' — red text

Action buttons:
  POSITIVE: 'Book Meeting Now' (emerald) + 'Send Custom Reply' (outlined)
  NEUTRAL:  'Schedule Re-engagement' (amber) + 'Reply Manually' (outlined)
  NEGATIVE: 'Close Lead' (red outlined) + 'Override & Reply' (ghost)


Enhanced: History Tab — V2 Updates
The existing history tab needs these additions to show full interaction threads with dates and reply status.

History Tab — V2 Enhancements
Filter bar (new, below tab header):
  Filter pills: All | Emails | Meetings | Replies
  Violet underline on active filter

Each timeline item now shows FULL DATE + TIME:
  Not 'Today' — show 'May 15, 2026 · 2:34 PM' in 11px gray

Thread view — email items expand to show full sequence:
  Initial Email (sent)
    └─ Follow-up 1 (sent after 3 days)
         └─ Lead Reply: 'POSITIVE' badge + preview
              └─ Meeting Booked: emerald dot + meet link

Reply items in thread:
  Different background: rgba(34,197,94,0.05) for positive replies
  Incoming mail icon (different from outgoing)
  Classification badge visible
  Reply text preview (1 line, expandable)

Meeting items now show:
  Full datetime: 'May 20, 2026 · 3:00 PM IST'
  Duration badge
  Meet link as clickable chip
  Status: Upcoming / Completed / Cancelled


Enhanced: Notification Center (Top Nav — V2)
Notification Dropdown Spec
Bell icon: shows badge count of pending approvals

On click: dropdown panel slides down
  Width: 340px
  Background: #141720, border 1px rgba(255,255,255,0.08), radius 12px
  Shadow: 0 20px 60px rgba(0,0,0,0.5)

Header: 'Notifications' 14px/500 + 'Mark all read' violet link

Notification items (each ~72px height):
  Left icon: color matches type
    🟡 Follow-up pending: amber clock icon
    🟢 Reply received: emerald mail icon
    🔵 Meeting booked: violet calendar icon
    🔴 Email failed: red X icon

  Content:
    Title: 'Follow-up ready for John Doe' 13px/500
    Subtitle: 'john@acme.com · 3 days no reply' 11px gray
    Time: '5 min ago' 10px right-aligned

  1-click action button on right:
    Follow-up: 'Approve' amber button 28px height
    Reply: 'View' violet button 28px height

Empty state: bell icon + 'All caught up' 13px gray centered




PART 4 — FIGMA FILE ORGANIZATION  (Updated for V2)


Pages in Figma File
Page 1: Cover — Project title, version, team info
Page 2: Design System — Colors, typography, spacing, icons, all component variants
Page 3: V1 UI States — All original 5 states preserved
Page 4: V2 UI States — All 6 new states (see below)
Page 5: Components — All reusable components with variants
Page 6: Mobile (390px) — Optional responsive version

V2 Frames to Create (Page 4)
State 6: Lead Discovery — Left panel in 'Find Leads' mode, chat showing lead list card with 10 leads, 3 selected
State 7: Bulk Approval — Bulk email approval card in chat, 15 leads selected, email preview showing
State 8: Follow-up Pending — Amber follow-up card in chat, campaigns tab open in right panel showing timeline
State 9: Reply Received — POSITIVE reply card in chat, history tab showing thread view with reply
State 10: Meeting Auto-Booked — Green success card, meet link shown, notification bell has count
State 11: Campaign Active — Full campaign view, timeline visualizer with 2 steps completed

V1 Frames to Keep (Page 3)
State 1: Empty / Onboarding — No lead entered, no messages (+ add Onboarding wizard overlay variant)
State 2: Research Active — Lead info filled, agent thinking, research response in chat
State 3: Email Generated — Email draft card, suggestion chips, right panel with actions
State 4: Awaiting Approval — Messaging agent approval flow
State 5: Email Sent — Success confirmation, history updated

New Components to Add to Component Library
Lead Card — variants: New / Contacted / Replied / Meeting Booked / Cold, Collapsed / Expanded
Lead List Card — variants: Empty / Loading / With results (N leads)
Bulk Approval Card — variants: Pending / Sending (progress) / Complete
Follow-up Pending Card — variants: Email follow-up / Meeting follow-up
Reply Received Card — variants: Positive / Neutral / Negative
Follow-up Timeline — variants: Not configured / 1 step done / 2 steps done / Complete
Notification Item — variants: Follow-up pending / Reply received / Meeting booked / Error
Onboarding Card — variants: Step 1 / Step 2
Lead Profile Modal — variants: Loading / Enriching / Fully loaded



PART 5 — ANIMATION & MICRO-INTERACTION NOTES  (V2 Additions)


New Animations Required
Lead list loading: skeleton shimmer animation on lead cards while database query runs
Lead count preview: number counts up from 0 to result when criteria changes
Bulk send progress: violet progress bar fills left to right as emails send
Follow-up timeline: step dots animate from hollow to filled when completed
Reply received: card slides in from bottom with gentle spring bounce
Notification badge: number increments with a quick scale animation (1.3x → 1.0x)
Lead profile modal: slides from right with 280ms ease-out, overlay darkens background
LLM recommendation fill: when 'Ask LLM' is clicked, day inputs fill one by one with typewriter effect

Preserved V1 Animations
Typing indicator: three dots bounce (0, 200ms, 400ms delay)
Session active dot: ping animation expanding + fading
Agent status dots: same ping animation for active agent
Send button: violet glow on hover (box-shadow 0 0 20px rgba(124,92,252,0.4))
Input focused: border glow 0 0 0 2px rgba(124,92,252,0.4)
Lead score donut: stroke-dashoffset transition 0.6s ease
Empty state orb: pulse-orb animation (scale 1 → 1.05, 3s infinite)



End of Figma Prompt — Outreach AI V1 + V2
Pass this entire document to Figma AI, a UI designer, or another LLM to implement
