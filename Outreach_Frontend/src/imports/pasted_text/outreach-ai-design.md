OUTREACH AI
Figma Design Prompt — Final Version
Updated Left Panel Architecture + Full UI Specification
Industry-level approach: Apollo.io + Clay + HubSpot pattern
Pass this entire document to Figma AI or any UI designer

SECTION 1 — KEY ARCHITECTURE DECISION


What Changed and Why
✅ Old Approach (Removed)
Separate onboarding screens (Tell us about yourself + Who are you targeting?)
User fills these once at the start as standalone full-screen pages
Problem: User forgets what they filled, cannot easily edit, disconnected from workflow


✅ New Approach (Industry Level — Apollo.io / Clay pattern)
Both sections live PERMANENTLY in the left panel — always visible, always editable
Section 1: Your Profile (name, email, company, what you sell)
Section 2: Target Criteria (industry, role, size, geography) — the Find Leads tab
Each section has Save + Edit buttons
Once saved, this context is AUTOMATICALLY sent to LLM with every chat message
User just types: 'Find me leads' — LLM already knows profile + target from saved context
No repeating. No separate onboarding flow. No navigation away from main screen.


💡 Why This Is Industry Standard
Apollo.io: Saves ICP (Ideal Customer Profile) once → every search uses it automatically
Clay: Saves enrichment preferences → applies to every lead found
HubSpot: Saves target persona → pre-fills every campaign
This approach is better because it combines saved context + chat-driven search in one flow
The user never has to repeat themselves — the AI always has full context



SECTION 2 — DESIGN SYSTEM  (Unchanged from V1)


Visual Language & Design Tokens
Dark premium SaaS. Primary background: deep near-black #0D0F12. Secondary surfaces: #141720 for cards and panels. Tertiary: #1E2230 for hover states. This palette creates depth without feeling flat.

Colors
Background primary: #0D0F12
Background cards/panels: #141720
Background hover/inputs: #1E2230
Background interactive: #252A3A
Primary accent violet: #7C5CFC — CTAs, active states, agent indicators
Violet soft: #A78BFA — research agent color
Emerald: #22C55E — success, positive status, messaging agent
Emerald soft: #34D399
Amber: #F59E0B — pending, awaiting approval
Red: #EF4444 — errors, failed, negative
Text primary: #F0F1F5
Text secondary: rgba(255,255,255,0.5)
Text tertiary: rgba(255,255,255,0.25)
Border subtle: rgba(255,255,255,0.06)
Border interactive: rgba(255,255,255,0.12)

Typography — Inter font throughout
Page title: 24px / 600 weight
Section title: 16px / 500 weight
Card title: 14px / 500 weight
Body text: 14px / 400 weight
Secondary text: 13px / 400 weight
Labels uppercase: 11px / 500 weight / 0.08em letter-spacing
Micro text: 11px / 400 weight
Code/mono: Courier New or JetBrains Mono
Line height: 1.6 throughout. Never below 11px.

Spacing — Base unit 4px
All spacing, padding, margins = multiples of 4px
Card internal padding: 16–20px
Section gaps: 20–24px
Outer page margin: 24px
Input height: 38–40px
Button height: 36px standard, 44px primary CTA

Borders & Surfaces
Cards: 1px border rgba(255,255,255,0.06), radius 12px
Inputs: 1px border rgba(255,255,255,0.08), radius 8px
Chips/tags: radius 6px
Pill buttons: radius 20px
Modal/overlay: radius 16px
Everything floats — no harsh borders

Interactive States
Input focused: border rgba(124,92,252,0.6) + box-shadow 0 0 0 2px rgba(124,92,252,0.15)
Button primary hover: box-shadow 0 0 20px rgba(124,92,252,0.35)
Button disabled: opacity 0.4, cursor not-allowed
Card hover: background lightens to #252A3A
Transition: all 0.18s ease on interactive elements


SECTION 3 — PAGE LAYOUT


Overall Layout — Three Column, Full Viewport
Canvas: 1440px wide. Height: 100vh. No outer scrolling. Three fixed vertical columns. Top navigation bar spans full width.

┌──────────────────────────────────────────────────────────────────┐
│  TOP NAVIGATION BAR (56px height, full width)                    │
├─────────────────┬──────────────────────────┬────────────────────┤
│  LEFT PANEL     │   CENTER — CHAT PANEL    │  RIGHT PANEL       │
│  320px fixed    │   fills remaining ~760px │  320px fixed       │
│                 │                          │                    │
│  YOUR PROFILE   │   Message thread         │  Actions tab       │
│  (always open)  │   (scrollable)           │  History tab       │
│                 │                          │  Campaigns tab     │
│  ─────────────  │   ────────────────────── │                    │
│  Manual Entry   │   Input area (fixed)     │                    │
│  Find Leads     │   (120px)                │                    │
│  (tabs)         │                          │                    │
└─────────────────┴──────────────────────────┴────────────────────┘



SECTION 4 — TOP NAVIGATION BAR


Top Navigation Bar
Top Nav Spec
Height: 56px
Background: #141720
Bottom border: 1px rgba(255,255,255,0.06)
Padding: 0 24px

LEFT SIDE:
  Violet geometric logo mark (lightning bolt in violet square, 28px, radius 8px)
  Wordmark: 'Outreach AI' — 16px / 500 / #F0F1F5
  Divider: 1px rgba(255,255,255,0.12) vertical, 16px tall
  Breadcrumb: 'Workspace' rgba(255,255,255,0.3) + '/' + 'Active Session' rgba(255,255,255,0.5)
  All in same row, 12px, gap 6px

CENTER:
  Session status indicator — centered in nav
  Active state: pulsing green dot (8px, ping animation) + 'Session Active — #sess-id' in 12px #22C55E
  Inactive state: gray dot (8px) + 'No Session' in 12px rgba(255,255,255,0.4)
  Tooltip on hover: 'Your conversation history is preserved across messages'

RIGHT SIDE (gap 8px between items):
  Bell icon button (32px, rounded, hover bg #1E2230)
    Badge: violet circle #7C5CFC, 16px, shows count, 9px text
  Settings gear icon button (32px, same hover style)
  User avatar circle (32px)
    Background: #1E2230
    Border: 2px solid #7C5CFC (violet ring)
    Initials: 12px / 600 / #F0F1F5



SECTION 5 — LEFT PANEL  (Core Architecture Change)


Left Panel — Complete Specification
320px wide, fixed, always visible, scrollable internally. Background #0D0F12. Right border 1px rgba(255,255,255,0.06). Font: Inter.

Key Principle — Left Panel Structure
The left panel has THREE stacked sections from top to bottom:
1. YOUR PROFILE section — always visible, save/edit toggle
2. Tab switcher: [ Manual Entry ] [ Find Leads ]
3. Tab content below — either manual entry form OR find leads filters

NO separate onboarding screens. Everything lives here permanently.
Saved data automatically flows to LLM with every chat message.


Section A — Panel Header (always visible, fixed top)
Panel Header Spec
Padding: 20px 20px 0 20px

Row 1 — Title + Live Context badge:
  Left: 'Lead Context' — 16px / 500 / #F0F1F5
  Left below title: 'AI uses this to personalize outreach' — 12px / rgba(255,255,255,0.35)
  Right: 'Live Context' badge
    Background: rgba(124,92,252,0.12)
    Border: 1px rgba(124,92,252,0.25)
    Radius: 6px, padding 4px 8px
    Dot: 6px violet circle with slow pulse animation
    Text: 'Live Context' — 11px / 500 / #7C5CFC


Section B — YOUR PROFILE (New — Always Visible)
Your Profile Section Spec
Background: #141720
Border: 1px rgba(255,255,255,0.06)
Border radius: 12px
Margin: 16px 20px 0 20px
Padding: 14px

HEADER ROW:
  Left: 'YOUR PROFILE' — 11px / 500 / rgba(255,255,255,0.35) / uppercase / 0.08em tracking
  Right: Two buttons in row (shown in VIEW mode):
    'Edit' button — ghost, 28px height, 10px text, violet text, violet border
    (In EDIT mode: replace with 'Save' button — violet filled + 'Cancel' ghost)

VIEW MODE (after save — default state):
  Shows saved data as read-only rows
  Each row: icon (14px rgba(255,255,255,0.3)) + value text (13px #F0F1F5)
  Rows: Name / Email / Company / What you sell (truncated 2 lines)
  All rows have subtle dividers rgba(255,255,255,0.04)
  Empty fields shown as '—' in gray

EDIT MODE (when Edit clicked):
  Fields appear as dark inputs, same style as original lead panel fields
  Field 1 — YOUR NAME
    Label: 'YOUR NAME' 11px uppercase gray
    Input: person icon left, placeholder 'e.g. Alex Johnson'
  Field 2 — YOUR EMAIL
    Label: 'YOUR EMAIL'
    Input: envelope icon, placeholder 'alex@yourcompany.com'
  Field 3 — YOUR COMPANY
    Label: 'YOUR COMPANY'
    Input: building icon, placeholder 'e.g. Acme Corp'
  Field 4 — WHAT YOU SELL
    Label: 'WHAT YOU SELL'
    Textarea (3 rows): briefcase icon, placeholder 'e.g. AI-powered sales automation for B2B SaaS'

SAVE BUTTON ROW (edit mode only):
  'Save Profile' — full width, violet filled, 36px height
  'Cancel' — full width, ghost outlined, below save button

SAVED STATE INDICATOR:
  After save: tiny green checkmark + 'Profile saved' 11px green — shown 2 seconds then fades

IMPORTANT: When profile is saved, a subtle 'Context ready' indicator
appears at bottom of section — small green dot + 'Sending to AI' 10px
This tells user their profile is live context for the LLM


Section C — Tab Switcher
Tab Switcher Spec
Position: below Your Profile section, margin-top 16px
Padding: 0 20px

Two tabs in a row:
  [ Manual Entry ]  [ Find Leads ]

Tab style:
  Background: none, no border
  Font: 14px / 500
  Active: #F0F1F5 color + 2px violet underline (#7C5CFC)
  Inactive: rgba(255,255,255,0.4) + 2px transparent underline
  Transition: all 0.15s ease
  Gap between tabs: 20px
  Bottom border of tab row: 1px rgba(255,255,255,0.06)
  Padding bottom of tab: 8px


Section D — Manual Entry Tab Content
Manual Entry Tab Spec
Padding: 16px 20px
Same fields as original V1 lead panel

Field 1 — LEAD NAME (required *)
  Label: 'LEAD NAME *' — 11px uppercase / rgba(255,255,255,0.35) / 0.08em tracking
  Input: #1E2230 bg, person icon left, placeholder 'e.g. John Doe'
  Height: 38px, radius 8px

Field 2 — EMAIL (required *)
  Label: 'EMAIL *'
  Input: envelope icon left
  Validation: green checkmark appears right when valid email typed

Field 3 — COMPANY (required *)
  Label: 'COMPANY *'
  Input: building icon left

Field 4 — WEBSITE
  Label: 'WEBSITE' + 'OPTIONAL' badge (gray pill 9px)
  Input: globe icon left, placeholder 'https://zapier.com'

Field 5 — LINKEDIN
  Label: 'LINKEDIN' + 'OPTIONAL' badge
  Input: LinkedIn SVG icon left, placeholder 'linkedin.com/in/...'

All inputs:
  Background: #1E2230
  Border: 1px rgba(255,255,255,0.08)
  Focused border: rgba(124,92,252,0.6) + glow
  Text: 14px #F0F1F5
  Radius: 8px, height 38px
  Gap between fields: 12px


Section E — Find Leads Tab Content (Updated)
Find Leads Tab Spec
Padding: 16px 20px

IMPORTANT: Selections from onboarding (industry/role/size) are
PRE-FILLED here from the saved Your Profile + onboarding data.
User sees their choices already selected — they can change them.

GROUP 1 — TARGET INDUSTRY
  Label: 'TARGET INDUSTRY' — 11px uppercase gray
  Pill chips (multi-select, wrap to next line):
    SaaS / Fintech / Healthcare / eCommerce / Other
  Chip style (unselected): #1E2230 bg, 1px rgba(255,255,255,0.12) border,
    rgba(255,255,255,0.6) text, radius 8px, padding 6px 14px, 13px font
  Chip style (selected): #7C5CFC bg, no border, white text, same radius
  Transition: background 0.15s ease

GROUP 2 — TARGET JOB ROLE
  Label: 'TARGET JOB ROLE' — same label style
  Chips: CTO / VP Sales / Founder / Marketing Head / Other
  Same chip style as above

GROUP 3 — COMPANY SIZE
  Label: 'COMPANY SIZE' — same label style
  Chips (circle style for size): 1–50 / 50–200 / 200–1000 / 1000+
  Circle chip: 48px wide min, same bg/selected colors

GROUP 4 — GEOGRAPHY
  Label: 'GEOGRAPHY' + 'optional' badge (lowercase, gray)
  Input: globe icon left, placeholder 'e.g. USA, India, Global'
  Same dark input style

GROUP 5 — LEAD COUNT
  Label: 'LEAD COUNT' — left aligned
  Count display: '25 leads' — right aligned, 13px violet
  Slider: full width, violet filled track, violet thumb circle
  Range: 10 (left label) to 50 (right label) — 11px gray

MATCH PREVIEW BADGE:
  Full width card below slider
  Background: rgba(124,92,252,0.08)
  Border: 1px rgba(124,92,252,0.2), radius 8px
  Padding: 10px 14px
  Icon: search icon violet (14px) + '~370 leads match your criteria'
  Font: 13px / rgba(255,255,255,0.7)
  Updates dynamically as user changes filters

SAVE CRITERIA BUTTON:
  Full width, violet filled, radius 10px, height 44px
  Icon: save/checkmark icon left
  Text: 'Save Criteria' — 14px / 500 / white
  IMPORTANT: This button ONLY saves — it does NOT trigger search
  After save: button changes to 'Criteria Saved ✓' in green for 2 seconds
  Then shows two buttons: 'Saved ✓' (ghost green) + 'Edit' (ghost gray)

SAVED STATE (after Save Criteria clicked):
  All chips become read-only (not clickable)
  A 'Context Saved' indicator appears:
    Small green dot + 'Find Leads criteria saved to AI context' — 11px gray italic
  Edit button appears top right of section to re-enable editing

NOTE — HOW SEARCH ACTUALLY TRIGGERS:
  The user types a natural language prompt in chat:
  'Find me leads' or 'Find 25 CTOs in Fintech' etc.
  The LLM automatically uses saved Profile + Criteria as context
  NO search button that queries database — the chat IS the trigger


Section F — Lead Score Card (below tabs, always visible)
Lead Score Donut Spec
Background: #141720
Border: 1px rgba(255,255,255,0.06), radius 12px
Margin: 16px 20px 0 20px
Padding: 16px

Left: SVG donut chart — 80px diameter
  Track: rgba(255,255,255,0.06), strokeWidth 7
  Fill: #7C5CFC, animated stroke-dashoffset transition 0.6s ease
  Center: score number 20px/600 violet + 'Lead Score' 9px gray below

Right: Three mini progress bars
  'Research Depth' + percentage + violet bar
  'Personalization' + percentage + violet bar
  'Engagement' + percentage + violet bar
  Bar height: 3px, track rgba(255,255,255,0.06), fill #7C5CFC
  Label: 10px rgba(255,255,255,0.5)
  All bars animated on mount (width 0 → value, 0.6s ease)


Section G — Agent Status Card (bottom of left panel)
Agent Status Spec
Background: #141720
Border: 1px rgba(255,255,255,0.06), radius 12px
Margin: 16px 20px 20px 20px
Padding: 14px

Label: 'AGENT STATUS' — 11px uppercase gray, margin-bottom 10px

Three agent rows (each row: dot + name + 'active' label on right):

Row 1 — Coordinator:
  Dot: 8px circle, rgba(255,255,255,0.7) when active, rgba(255,255,255,0.2) when idle
  Label: 'Coordinator' — 12px
  Active: ping animation on dot + 'active' 10px right-aligned

Row 2 — Research Agent:
  Dot: 8px circle, #7C5CFC when active, rgba(124,92,252,0.3) idle
  Label: 'Research Agent' — 12px, violet when active
  Active: ping animation

Row 3 — Messaging Agent:
  Dot: 8px circle, #22C55E when active, rgba(34,197,94,0.3) idle
  Label: 'Messaging Agent' — 12px, emerald when active
  Active: ping animation



SECTION 6 — CENTER CHAT PANEL


Chat Panel — Complete Specification
Fills remaining width (~760px). Full height minus top nav. Two sub-areas: scrollable message thread + fixed input area at bottom.

6.1 Empty State
Empty State Spec
Shown when no messages exist
Centered vertically and horizontally in chat area

Violet gradient orb:
  110px diameter circle
  Background: radial-gradient(circle at 35% 35%, rgba(124,92,252,0.55), rgba(124,92,252,0.08) 60%, transparent)
  Box-shadow: 0 0 60px rgba(124,92,252,0.18)
  Animation: pulse-orb — scale 1→1.05 over 3s infinite ease-in-out

Headline: 'Start a conversation' — 20px / 500 / #F0F1F5
Subtext: 'Fill in the lead details on the left, then type your message or use a quick action below.'
  14px / rgba(255,255,255,0.38) / centered / max-width 320px / line-height 1.65


6.2 Message Types
User Message Bubble
User Bubble Spec
Alignment: right
Max width: 70% of chat area
Background: rgba(124,92,252,0.14)
Border: 1px rgba(124,92,252,0.28)
Border radius: 14px 14px 4px 14px
Padding: 12px 16px
Text: 14px / 400 / #F0F1F5 / line-height 1.65
Timestamp below: 11px / rgba(255,255,255,0.22) / right-aligned


Agent Message Bubble — Research Agent
Research Agent Bubble Spec
Alignment: left, max-width 88%

Agent badge (above bubble):
  22px square icon: rgba(167,139,250,0.1) bg, 1px rgba(167,139,250,0.2) border, radius 6px
  Initial 'R' inside: 9px / 700 / #A78BFA
  'Research Agent' label: 11px / 600 / #A78BFA
  Search icon next to label: 10px #A78BFA
  Tagline: 'Lead intelligence & personalization' 10px rgba(255,255,255,0.25)

Bubble:
  Background: linear-gradient(135deg, rgba(167,139,250,0.07), rgba(30,34,48,0.95))
  Border: 1px rgba(167,139,250,0.2)
  Border radius: 4px 14px 14px 14px
  Left accent: 3px wide gradient bar (top #A78BFA → bottom rgba(167,139,250,0.2))
  Text: 14px / 400 / #E4E6EC / line-height 1.7 / white-space pre-wrap

Rationale pill (below bubble, if present):
  '💡 [rationale text]'
  Background: rgba(167,139,250,0.08), border 1px rgba(167,139,250,0.15)
  Radius: 20px, padding 4px 10px, font 11px italic #A78BFA

Follow-up chips (below rationale, if present):
  Ghost pills: rgba(167,139,250,0.07) bg, 1px rgba(167,139,250,0.25) border
  Text: 11px #A78BFA, radius 20px, padding 4px 12px
  Hover: rgba(167,139,250,0.15) bg
  Clicking a chip pre-fills the chat input


Agent Message Bubble — Messaging Agent
Messaging Agent Bubble Spec
Same structure as Research Agent bubble
Color: emerald green theme (#34D399 / rgba(52,211,153,x))
Initial 'M', label 'Messaging Agent', tagline 'Outreach, email & booking'
Left accent bar: top #34D399 → bottom rgba(52,211,153,0.2)
Border: 1px rgba(52,211,153,0.18)


Typing Indicator
Typing Indicator Spec
Stage label above: '[current stage text]' — 11px rgba(255,255,255,0.3)
Stages cycle: 'Coordinator routing...' → 'Research Agent activated...'
  → 'Scraping website...' → 'Analyzing tech stack...' → 'Generating response...'

Bubble: background #1A1E2E, radius 12px, padding 12px 18px
Three dots: 6px circles, #7C5CFC
Animation: bounce — translateY 0 → -6px → 0, 1.2s infinite
Delays: dot 1 = 0ms, dot 2 = 200ms, dot 3 = 400ms
Gap between dots: 5px


Lead List Card — NEW
Lead List Card Spec
Shown in chat when agent finds multiple leads
Background: #141720
Border: 1px rgba(255,255,255,0.08), radius 14px
Max width: 95% of chat area

HEADER (padding 14px 16px, border-bottom 1px rgba(255,255,255,0.06)):
  Left: search icon violet + 'Found N Leads' — 14px / 500 / #A78BFA
  Right: checkbox 'Select All' + count badge 'N selected' (violet pill)
  Below: 'Matching: CTO in Fintech · USA · 50–200 employees' — 11px gray

LEAD LIST (scrollable, max-height 360px, custom scrollbar):
  Each lead row (48px height, border-bottom 1px rgba(255,255,255,0.05)):

  [ checkbox 16px ]  [ avatar 32px ]  [ name + title col ]  [ company ]  [ status ]  [ chevron ]

  Checkbox: dark bg, violet when checked, 4px radius
  Avatar circle 32px: initials 12px/600, gradient bg based on status
    New: violet gradient
    Contacted: amber gradient
    Replied: emerald gradient
    Cold: gray gradient
  Name: 13px / 500 / #F0F1F5
  Title/Designation: 11px / rgba(255,255,255,0.5) below name
  Company: 12px / #A78BFA / right of name column
  Status badge: pill 10px
    'New' — gray bg rgba(255,255,255,0.08) / gray text
    'Contacted' — amber bg rgba(245,158,11,0.15) / #F59E0B text
    'Replied' — emerald bg rgba(34,197,94,0.12) / #22C55E text
    'Cold' — red bg rgba(239,68,68,0.1) / #EF4444 text
  Chevron: 12px rgba(255,255,255,0.3), rotates 90deg when expanded

  Row hover: background #1E2230

  EXPANDED ROW (chevron clicked — appears below row, 4px indent):
    Email row: envelope icon + email text + copy icon button
    Phone row: phone icon + number (if available)
    LinkedIn: LinkedIn icon + link (clickable violet)
    Company summary: 2 lines truncated gray text, 'Read more' violet link
    Tech stack chips: small gray pills (React, HubSpot, Salesforce etc.)
      Each chip: rgba(255,255,255,0.06) bg, 11px text, radius 4px, padding 2px 8px
    'View Full Profile →' — 12px violet link at bottom
    Background of expanded area: rgba(255,255,255,0.02), border-top 1px rgba(255,255,255,0.04)

FOOTER (sticky, padding 12px 16px, border-top 1px rgba(255,255,255,0.06)):
  Left: 'N leads selected' — 12px rgba(255,255,255,0.5)
  Right: 'Generate Emails for Selected →' — violet filled button, 36px, 13px
  Second state (after emails generated): 'Send Emails Now' replaces Generate button


Email Draft Card — in Chat
Email Draft Card Spec
Background: #141720
Border: 1px rgba(167,139,250,0.22), radius 4px 14px 14px 14px
Max width: 92% of chat area

HEADER (padding 12px 16px, border-bottom):
  Mail icon #A78BFA + 'Personalized Email Draft' 13px/500 #A78BFA
  Flag badge: 'Ready to Send' violet pill
  Copy icon button (right): shows checkmark 2s after click
  Edit icon button (right): toggles edit mode

SUBJECT (padding 12px 16px 0):
  'SUBJECT' label 11px uppercase gray
  Subject text: 14px / 500 / #F0F1F5

BODY (margin 10px 16px, background #1A1E2E, radius 8px, padding 12px):
  View mode: 13px / #C8CAD4 / line-height 1.75 / white-space pre-wrap
  Edit mode: textarea, same font, transparent bg, no border, min-height 200px

ACTIONS (padding 12px 16px, border-top):
  'Send Email' — violet filled, radius 8px, 13px/500, Send icon left
  'Refine Message' — outlined ghost, same height
  Hover on Send: box-shadow 0 0 20px rgba(124,92,252,0.4)

RATIONALE (padding 0 16px 12px):
  '💡 Why this angle: [text]' — violet italic pill, 11px


Bulk Email Approval Card — NEW
Bulk Approval Card Spec
Background: rgba(124,92,252,0.07)
Border: 1px rgba(124,92,252,0.25), left border 3px #7C5CFC
Border radius: 12px, padding: 20px

HEADER:
  Mail icon + 'Ready to Send to N Leads' — 15px / 500 / #A78BFA
  'AI has personalized each email. Review before sending.' — 12px gray

LEAD PREVIEW (3 rows, 'Show all N' violet link below):
  Row: avatar 24px + name + email truncated + 'Preview ↗' violet link
  Dividers: 1px rgba(255,255,255,0.04)

SUBJECT PREVIEW:
  'SUBJECT TEMPLATE' label + subject text in #252A3A card

RATIONALE PILL below subject

ACTIONS:
  'Approve & Send All' — full green #22C55E filled
  'Review Each First' — outlined ghost
  'Cancel' — text link red

PROGRESS STATE (after approve):
  Violet progress bar fills: '12 / 15 sent...'
  Complete: green checkmark + 'All N emails sent successfully'


Follow-up Pending Card — NEW
Follow-up Pending Card Spec
Background: rgba(245,158,11,0.06)
Border: 1px rgba(245,158,11,0.2), left border 3px #F59E0B
Border radius: 10px, padding: 16px

Clock icon amber + 'Follow-up Ready' — 14px / 500 / #F59E0B
'No reply received in 3 days from [Name] · [email]' — 12px gray

Email preview (collapsed, expand on click):
  'Follow-up #1 of 3' badge
  Subject: 13px / 500
  Body: 2 lines truncated + 'Expand' link

Timing: 'Scheduled: Today at 10:00 AM IST' — 12px gray

ACTIONS:
  'Approve & Send' — amber filled (#F59E0B, dark text)
  'Edit Email' — outlined ghost
  'Skip this lead' — gray text link


Reply Received Card — NEW
Reply Received Card Spec
Border color and background based on classification:
  POSITIVE → rgba(34,197,94,0.07) bg, 1px rgba(34,197,94,0.22) border
  NEUTRAL  → rgba(245,158,11,0.07) bg, 1px rgba(245,158,11,0.22) border
  NEGATIVE → rgba(239,68,68,0.07) bg, 1px rgba(239,68,68,0.22) border

HEADER:
  Avatar 32px + 'Reply from [Name]' 13px/500
  Classification badge: 'POSITIVE' / 'NEUTRAL' / 'NEGATIVE' — matching color bold
  Timestamp: 'May 15, 2026 · 2:34 PM' — 11px gray right-aligned

REPLY CONTENT:
  Lead's reply text in #252A3A card, 13px/400, line-height 1.7

LLM SUGGESTION ROW:
  Brain icon + 'LLM suggests:' label
  POSITIVE: 'Lead is ready to talk. Book a meeting.' emerald
  NEUTRAL: 'Lead wants contact in 30 days. Schedule re-engagement.' amber
  NEGATIVE: 'Lead not interested. Mark as closed.' red

ACTIONS:
  POSITIVE: 'Book Meeting Now' (emerald) + 'Send Custom Reply' (outlined)
  NEUTRAL: 'Schedule Re-engagement' (amber) + 'Reply Manually' (outlined)
  NEGATIVE: 'Close Lead' (red outlined) + 'Override & Reply' (ghost)


Meeting Booking Card
Meeting Card Spec
Background: #141720
Border: 1px rgba(52,211,153,0.18), radius 4px 14px 14px 14px
Max width: 80%

HEADER: calendar icon #34D399 + 'Meeting Proposal' 13px/500 #34D399

DETAILS (rows with icon + label + value):
  Calendar icon: Title
  Clock icon: Date & Time
  Clock icon: Duration
  Mail icon: Attendee

ACTIONS:
  'Confirm Booking' — #22C55E filled, flex 1
  'Edit Details' — outlined ghost, flex 1

CONFIRMED STATE:
  Green checkmark + 'Meeting Confirmed'
  Meet link as clickable chip: video icon + link text


Email Sent Banner
Email Sent Banner Spec
Background: rgba(52,211,153,0.07)
Border: 1px rgba(52,211,153,0.18), radius 10px
Padding: 12px 16px
Display: flex row, gap 10px

Left: CheckCircle2 icon 16px #34D399 (flex-shrink-0)
Right column:
  'Email sent successfully' — 14px / 500 / #34D399
  'View in Gmail ↗' — 12px #7C5CFC violet link with ExternalLink icon


System Message
System Message Spec
Centered in chat (not left or right aligned)
Background: rgba(124,92,252,0.07)
Border: 1px rgba(124,92,252,0.14), radius 20px
Padding: 5px 14px
Arrow icon 11px #7C5CFC + text rgba(255,255,255,0.45) 12px
Examples: 'Handing off to Messaging Agent...' / 'Email send cancelled by user.'


6.3 Chat Input Area (Fixed Bottom)
Chat Input Spec
Position: fixed at bottom of chat panel
Background: #141720
Border-top: 1px rgba(255,255,255,0.06)
Padding: 16px 20px
Flex-shrink: 0

TEXTAREA WRAPPER:
  Background: #1E2230
  Border: 1px rgba(255,255,255,0.08) default / rgba(124,92,252,0.55) focused
  Box-shadow on focus: 0 0 0 2px rgba(124,92,252,0.12)
  Radius: 12px, padding 12px 14px, margin-bottom 10px
  Transition: all 0.2s ease

TEXTAREA:
  Background: transparent, no border, no outline
  Font: 14px / #F0F1F5 / inherit family
  Rows: 1 default, auto-expands to max 4 rows
  Placeholder: 'Ask the agent to research, write an email, book a meeting...'
  Disabled state: placeholder 'Fill in required lead details first...'

ACTIONS ROW (below textarea, flex space-between):
  Left group (gap 2px):
    Paperclip icon button — file attach (hidden input triggered)
    X icon button — clear input
    All: 32px, rgba(255,255,255,0.25) color, hover bg #1E2230

  Right: Send button
    Background: #7C5CFC
    Height: 36px, padding 0 16px, radius 8px
    Icon: Send icon 14px + 'Send' text 14px/500 white
    Disabled: opacity 0.4, cursor not-allowed
    Hover: box-shadow 0 0 20px rgba(124,92,252,0.4)

QUICK CHIPS BAR (between textarea area and actual bottom):
  Shown only after first message
  Border-top: 1px rgba(255,255,255,0.04)
  Padding: 8px 28px
  Horizontal scroll row, nowrap
  'Quick:' label 11px rgba(255,255,255,0.2)
  Static chips: 'Research lead' / 'Write email' / 'Book meeting' / 'Check history'
    Style: transparent bg, 1px rgba(255,255,255,0.08) border, radius 20px
    Text: 11px rgba(255,255,255,0.45)
    Hover: violet border + violet text + rgba(124,92,252,0.06) bg
  Dynamic chips from LLM follow_up_recommendations (last 2 shown):
    Style: transparent bg, 1px rgba(124,92,252,0.3) border, #7C5CFC text
    Hover: rgba(124,92,252,0.1) bg



SECTION 7 — RIGHT PANEL


Right Panel — Actions, History & Campaigns
320px wide, fixed. Background #0D0F12. Left border 1px rgba(255,255,255,0.06). Three tabs: Actions | History | Campaigns.

Panel Header
Right Panel Header Spec
Padding: 20px 20px 0
Border-bottom: 1px rgba(255,255,255,0.06)
'Actions & History' — 16px / 500 / #F0F1F5, margin-bottom 12px

THREE TABS:
  Actions | History | Campaigns
  Same style as left panel tabs
  Active: #F0F1F5 + 2px violet underline
  Inactive: rgba(255,255,255,0.4) + transparent underline
  Gap: 16px between tabs


Actions Tab
Actions Tab Spec
Padding: 16px (scroll container)
Gap: 16px between cards

1. PENDING APPROVAL CARD (shown when messaging agent awaits confirmation):
  Background: rgba(245,158,11,0.06)
  Border: 1px rgba(245,158,11,0.2), left 3px #F59E0B, radius 10px
  'Awaiting Your Approval' — 13px / 500 / #F59E0B
  'The agent is ready to send an email to [email]' — 12px gray
  'Approve' green button + 'Decline' red outlined button

2. EMAIL DRAFT PREVIEW (compact, when personalized_message present):
  Background: #141720, border, radius 12px, padding 14px
  Header: 'Current Email Draft' 12px gray + Flag badge
  Subject: 13px / 500 / #F0F1F5
  Body: 3 lines truncated, 12px rgba(255,255,255,0.5)
  'View Full ↗' violet link → opens modal
  'Send This Email' violet filled button (full width)
  'Book a Meeting' outlined ghost button (full width)

3. QUICK ACTIONS GRID (2x2):
  Label: 'QUICK ACTIONS' 11px uppercase gray
  Four cards in grid:
    'Research Lead' — magnifier violet
    'Generate Email' — pen violet
    'Book Meeting' — calendar emerald
    'View History' — clock gray
  Each card: #1E2230 bg, 1px border, radius 10px, padding 12px
  Icon 18px + label 12px/500 rgba(255,255,255,0.7) below
  Hover: #252A3A bg, rgba(255,255,255,0.12) border


History Tab — Enhanced V2
History Tab Spec
FILTER BAR (new — top of history tab):
  Pills: All | Emails | Meetings | Replies
  Active: violet underline, #F0F1F5 text
  Inactive: rgba(255,255,255,0.4)
  Padding: 0 0 12px 0, border-bottom 1px rgba(255,255,255,0.06)

TIMELINE (padding 16px, position relative):
  Left vertical line: position absolute, left 7px, 1px rgba(255,255,255,0.1)
  Items: flex column, gap 16px

EACH TIMELINE ITEM:
  Dot (position absolute, left -17px, top 6px):
    8px circle
    Email sent: #22C55E + glow box-shadow
    Email failed: #EF4444 + red glow
    Meeting: #7C5CFC + violet glow
    Reply: #34D399 + emerald glow

  Card: #1E2230 bg, 1px rgba(255,255,255,0.06) border, radius 8px
  Padding: 10px 12px

  TOP ROW:
    Left: Type badge (Email/Meeting/Reply) + Status badge (Sent/Failed/Completed/POSITIVE)
    Right: FULL DATE + TIME — 'May 15, 2026 · 2:34 PM' 11px gray
    Chevron: 12px, rotates 90deg when expanded

  SUBJECT/TITLE ROW:
    13px / 500 / rgba(255,255,255,0.7), truncated, margin-top 4px

  THREAD INDICATOR (for emails with replies):
    Indented 12px, border-left 2px rgba(255,255,255,0.08)
    '● Reply: POSITIVE  May 16, 2026 · 10:12 AM'
    Reply badge matching classification color

  EXPANDED STATE (chevron clicked):
    For email: delivery status + body preview
    For meeting: duration + meet link chip (violet, video icon)
    For reply: full reply text preview

EMPTY STATE:
  Centered mail + calendar icons 28px gray
  'No interactions yet. Start by sending an outreach email.' 13px gray centered


Campaigns Tab — NEW
Campaigns Tab Spec
ACTIVE CAMPAIGN CARD:
  Background: #141720, border, radius 12px, padding 14px
  Campaign name: 14px / 500 / #F0F1F5
  'Active' pill: emerald bg, emerald text, right-aligned
  Stats row (4 numbers):
    '18 Leads' gray / '15 Contacted' violet / '3 Replied' emerald / '1 Meeting' green
    Each: number 20px/600 + label 11px gray below

FOLLOW-UP SEQUENCE SECTION:
  Label: 'FOLLOW-UP SEQUENCE' 11px uppercase gray

  HORIZONTAL TIMELINE STRIP:
    Day labels above: Day 0 / Day 3 / Day 7 / Day 14 — 10px gray
    Dots: 36px circles, 2px violet border
      Completed: violet filled (#7C5CFC) + white checkmark icon inside
      Current: violet outline + day number inside (13px/600 violet)
      Pending: rgba(255,255,255,0.1) outline + day number gray
    Connecting lines: dashed rgba(124,92,252,0.3)
      Completed segments: solid #7C5CFC
    Email type label below each dot: 'Initial' / 'Follow-up 1' / 'Follow-up 2' / 'Final'
      11px gray

  EDITABLE DAY INPUTS:
    'Days after initial:' — 12px gray label
    Three inputs in a row: FU#1 / FU#2 / FU#3
      Each: label (11px gray) + number input (dark bg, 48px wide, centered, violet border on focus)
      + 'days' label below

  LLM RECOMMENDATION BUTTON:
    Full width, outlined violet, radius 8px, height 40px
    Brain icon + '🤖 Ask LLM to recommend intervals'
    On click: shows recommendation in amber info box below

  DEFAULT NOTE:
    'Default: 3 / 7 / 14 days. Industry standard for B2B outreach.' 11px gray italic

  SAVE BUTTON:
    'Save Configuration' — full width, violet filled, height 44px, radius 10px



SECTION 8 — LEAD PROFILE MODAL


Lead Full Profile Modal
Slides in from the right side overlaying the right panel when user clicks 'View Full Profile →'.

Lead Profile Modal Spec
Width: 360px
Position: fixed right, full height minus nav
Background: #141720
Left border: 1px rgba(255,255,255,0.08)
Animation: translateX(360px) → translateX(0), 280ms ease-out
Overlay: rgba(0,0,0,0.4) on rest of screen

HEADER:
  Lead name: 18px / 600 / #F0F1F5
  Title + Company: 13px rgba(255,255,255,0.5) below name
  Status badge: top right
  Close X button: 32px, top right, rgba(255,255,255,0.4) hover
  Border-bottom: 1px rgba(255,255,255,0.06)

SCROLLABLE CONTENT (3 sections):

CONTACT INFO:
  Label: 'CONTACT INFO' 11px uppercase gray
  Email row: envelope + email + copy icon
  Phone row: phone icon + number (or '—' if missing)
  LinkedIn row: LinkedIn icon + clickable link
  Company row: building icon + company name
  Each row: #1E2230 bg, radius 8px, padding 10px 12px

COMPANY INTELLIGENCE:
  Label: 'COMPANY INTELLIGENCE' 11px uppercase gray
  Summary card: #1E2230 bg, 13px gray text, line-height 1.7
  Tech stack chips: colored pills
    CRM tools (HubSpot, Salesforce): amber #F59E0B bg
    Frontend (React, Vue): cyan #06B6D4 bg
    Analytics (Mixpanel, Segment): violet #A78BFA bg
    All chip bg at 0.15 opacity, text at full color
  'Enriching...' shimmer if not yet scraped:
    Animated gradient sweeping across placeholder bars

PAST INTERACTIONS (timeline):
  Label: 'PAST INTERACTIONS' 11px uppercase gray
  Same timeline style as history tab but compact
  Full date + time on each item
  Reply items show incoming mail icon + POSITIVE/NEUTRAL badge



SECTION 9 — NOTIFICATION CENTER


Notification Dropdown
Notification Dropdown Spec
Trigger: Bell icon in top nav
Position: drops below nav, right-aligned to bell icon
Width: 340px
Background: #141720
Border: 1px rgba(255,255,255,0.08), radius 12px
Shadow: 0 20px 60px rgba(0,0,0,0.5)
Max height: 400px, internal scroll

HEADER (padding 16px):
  'Notifications' 14px/500 #F0F1F5
  'Mark all read' violet link right-aligned 12px
  Border-bottom: 1px rgba(255,255,255,0.06)

NOTIFICATION ITEMS (each ~72px, border-bottom):
  Left: icon circle 36px
    Follow-up pending: amber bg rgba(245,158,11,0.12) + clock icon #F59E0B
    Reply received: emerald bg rgba(34,197,94,0.12) + mail icon #22C55E
    Meeting booked: violet bg rgba(124,92,252,0.12) + calendar icon #7C5CFC
    Email failed: red bg rgba(239,68,68,0.12) + X icon #EF4444
  Unread dot: 6px violet circle on top-right of icon

  Content (flex-1):
    Title: 13px/500 #F0F1F5 (truncated with ellipsis)
    Subtitle: 11px rgba(255,255,255,0.4) (email + status)
    Time: '5 min ago' 10px gray right-aligned

  Action button (right, 28px height, 12px text):
    Follow-up: 'Approve' amber filled
    Reply: 'View' violet filled
    Meeting: 'View' violet filled
    Failed: 'Retry' red outlined

  Item hover: #1E2230 bg

EMPTY STATE:
  Bell icon 28px gray centered + 'All caught up' 13px gray



SECTION 10 — FIGMA FILE ORGANIZATION


Figma File Structure
Pages
Page 1: Cover — Project name, version, date
Page 2: Design System — All tokens: colors, typography, spacing, shadows, radius
Page 3: Components — All reusable components with all variants
Page 4: Main UI — All frames (V1 states + V2 states)
Page 5: Mobile — 390px responsive (optional)

Frames on Main UI Page
V1 States (keep, update left panel only):
Frame 1: Empty State — No messages, left panel showing Your Profile (edit mode) + Manual Entry tab
Frame 2: Research Active — Profile saved, agent thinking, research response
Frame 3: Email Generated — Email draft card in chat, suggestion chips, right panel actions
Frame 4: Awaiting Approval — Messaging agent showing approve/decline
Frame 5: Email Sent — Success banner, history updated

V2 States (new):
Frame 6: Profile Saved — Left panel showing Your Profile in view/read mode + Find Leads tab with saved criteria
Frame 7: Lead Discovery — Find Leads criteria saved, chat shows lead list card with 6 leads
Frame 8: Lead Expanded — One lead row expanded showing email/company summary/tech stack
Frame 9: Profile Modal Open — Lead profile modal slid in from right, showing contact + intelligence + history
Frame 10: Bulk Approval — Bulk email approval card in chat, 4 leads selected
Frame 11: Follow-up Pending — Amber follow-up card in chat, campaigns tab open in right panel
Frame 12: Reply Received — POSITIVE reply card in chat, history tab showing thread view
Frame 13: Meeting Auto-Booked — Green meeting confirmed card, notification badge showing 1

Components Library — All variants needed
LeftPanel/YourProfile — variants: Edit mode / View mode / Saving state
LeftPanel/FindLeads — variants: Editing / Saved / Criteria saved indicator
ChatBubble/User — default
ChatBubble/Agent — variants: Research / Messaging / Coordinator
ChatBubble/Typing — animated
ChatBubble/System — centered pill
LeadListCard — variants: Loading skeleton / 0 selected / N selected / All selected
LeadRow — variants: New / Contacted / Replied / Cold, Collapsed / Expanded
EmailDraftCard — variants: Drafting / Ready / Sent, View mode / Edit mode
BulkApprovalCard — variants: Pending / Sending progress / Complete
FollowUpCard — variants: Email followup / Meeting followup
ReplyCard — variants: Positive / Neutral / Negative
MeetingCard — variants: Proposal / Confirmed
EmailSentBanner — default
RightPanel/Actions — variants: Empty / With draft / With pending approval
RightPanel/History — variants: Empty / With items / Filtered
RightPanel/Campaigns — variants: No campaign / Active campaign / Timeline states
LeadProfileModal — variants: Loading / Enriching / Loaded
NotificationItem — variants: Follow-up / Reply / Meeting / Failed
NotificationDropdown — variants: Empty / With items
Button — variants: Primary / Secondary / Ghost / Danger / Success, all states
Input — variants: Default / Focused / Error / Success / Disabled, with/without icon
Chip/Pill — variants: Industry / Role / Size / Status / Tech / Action
AgentBadge — variants: Coordinator / Research / Messaging
StatusDot — variants: Active (pulsing) / Idle / Session Active / No Session


SECTION 11 — ANIMATIONS & MICRO-INTERACTIONS


All Animations
Left Panel Animations
Profile save: fields collapse to read-only rows with height animation (200ms ease-out)
'Profile saved ✓' indicator: fade in → show 2s → fade out
'Context Saved' indicator: same fade pattern, green dot pulses
Chip selection: background transition 0.15s ease
Lead count preview badge: number counts up 0→N when criteria changes (300ms)
Slider thumb: smooth drag with violet track fill
Chat Panel Animations
New message: slides up from bottom with 200ms ease-out
Typing dots: bounce animation — translateY 0→-6px→0, 1.2s infinite, staggered 200ms
Typing stage text: fade in/out on each stage change, 400ms
Lead list card: skeleton shimmer while loading (gradient sweep animation)
Lead row expand: height animates from 48px → full content, 200ms ease
Bulk send progress bar: width 0%→100% over actual send time
Reply card: slides in from bottom, spring-like 280ms
Empty state orb: pulse-orb — scale 1→1.05, 3s infinite ease-in-out
Right Panel Animations
Tab switch: underline slides horizontally between tabs (translateX)
Campaign timeline dots: fill from hollow → solid when step completes
Campaign connecting line: draws from left to right when segment completes
LLM recommendation fill: day inputs fill one by one with typewriter timing
Notification badge: scale 1.3→1.0 when count increments
Modal Animations
Lead profile modal open: translateX(360px)→0, 280ms ease-out
Lead profile modal close: translateX(0)→(360px), 220ms ease-in
Overlay: opacity 0→0.4 on open, 0.4→0 on close, 200ms
Persistent Animations (looping)
Session active dot: ping — scale(1)→scale(2) + opacity 1→0, 1.5s infinite
Agent active dot: same ping animation on violet/emerald dots
Live Context badge dot: slow pulse — opacity 1→0.3→1, 2s infinite
Lead score donut: stroke-dashoffset transition 0.6s ease on mount/change


End of Figma Design Prompt — Outreach AI Final Version
Pass this entire document to Figma AI or any UI designer to implement
