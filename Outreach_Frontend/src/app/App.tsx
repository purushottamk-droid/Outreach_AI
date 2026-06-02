import { useState, useCallback, useEffect } from "react";
import { TopNav } from "./components/TopNav";
import { LeadPanel, YourProfile, FindLeadsCriteria } from "./components/LeadPanel";
import { ChatPanel, MessageType, LeadItem, BriefLead } from "./components/ChatPanel";
import { ActionHistoryPanel, HistoryItem, PanelLead } from "./components/ActionHistoryPanel";
import { LeadProfileModal, LeadProfile } from "./components/LeadProfileModal";
import LoginPage from "./components/LoginPage";
import { api } from "../api";

// // Persistent user_id using email or localStorage
// const USER_ID = localStorage.getItem("user_id") || (() => {
//   const id = "user-" + Math.random().toString(36).slice(2, 9);
//   localStorage.setItem("user_id", id);
//   return id;
// })();


// ─── Types ─────────────────────────────────────────────────────────────────────
interface LeadData {
  name: string;
  email: string;
  company: string;
  website: string;
  linkedin: string;
  companySummary?: string;  // ← ADD
  techStack?: string;       // ← ADD
}

interface EmailDraft {
  subject: string;
  body: string;
  rationale: string;
  flag: 0 | 1 | 2;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── Typing stage sequences ────────────────────────────────────────────────────
const STAGES_RESEARCH = [
  "Coordinator routing...", "Research Agent activated...",
  "Scraping website...", "Analyzing tech stack...",
  "Building personalization...", "Generating response...",
];
const STAGES_MESSAGING = [
  "Coordinator routing...", "Messaging Agent activated...",
  "Fetching lead history...", "Crafting personalized message...", "Generating response...",
];
const STAGES_FIND = [
  "Coordinator routing...", "Research Agent activated...",
  "Querying lead database...", "Filtering by criteria...",
  "Scoring leads...", "Results ready...",
];
const STAGES_BULK = [
  "Coordinator routing...", "Messaging Agent activated...",
  "Personalizing emails...", "Reviewing drafts...", "Ready for approval...",
];

// ─── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_LEADS: LeadItem[] = [
  { id: "l1", name: "Sarah Chen", title: "VP of Sales", company: "Fintech.io", email: "sarah@fintech.io", status: "new", techStack: ["Salesforce", "HubSpot", "React"], companySummary: "Series B fintech startup focused on payment infrastructure for SMBs. Recently raised $40M and scaling RevOps team." },
  { id: "l2", name: "Marcus Williams", title: "CTO", company: "PayVault", email: "marcus@payvault.com", phone: "+1 (415) 555-0142", status: "contacted", techStack: ["AWS", "Stripe", "Segment"], companySummary: "B2B payments platform growing from 45 to 120 employees this year. Tech-forward, open to new tools." },
  { id: "l3", name: "Priya Sharma", title: "Founder & CEO", company: "LendOS", email: "priya@lendos.ai", linkedin: "linkedin.com/in/priyasharma", status: "replied", techStack: ["Python", "Snowflake", "dbt"], companySummary: "AI-powered lending decisioning platform. SOC2 certified. Growing from 20 to 60 employees." },
  { id: "l4", name: "James O'Brien", title: "VP Engineering", company: "Clearbank", email: "james@clearbank.io", status: "cold", techStack: ["Kubernetes", "Postgres", "Datadog"], companySummary: "Embedded banking infrastructure for fintechs. Handling 2M+ transactions/day." },
  { id: "l5", name: "Ananya Patel", title: "Head of Growth", company: "RupayX", email: "ananya@rupayx.com", status: "new", techStack: ["Mixpanel", "HubSpot", "Notion"], companySummary: "Cross-border payments startup targeting South Asian markets. Series A, $12M raised." },
  { id: "l6", name: "Thomas Becker", title: "CTO", company: "NeoCard", email: "thomas@neocard.de", status: "new", techStack: ["React", "GCP", "BigQuery"], companySummary: "German neobank issuing virtual credit cards for B2B teams. 500+ enterprise customers." },
];

const MOCK_EMAIL_DRAFT = {
  subject: "AI-powered RevOps that fits your Salesforce + Outreach stack — quick chat?",
  body: `Hi [Lead Name],

Saw you're scaling the RevOps team at [Company] (congrats on the Series B!) and noticed a few posts about manual prospecting bottlenecks.

We work with companies at your exact stage to automate ICP enrichment and lead scoring — directly inside Salesforce, no new tools required. Our integration with Outreach.io means your reps get warm, pre-researched leads without touching Clay manually.

3 questions:
1. Is your team currently scoring leads manually or via a rules-based model?
2. What's your main bottleneck — ICP identification or outreach personalization?
3. Would a 20-min demo this week be useful?

Happy to share a quick case study from a similar-stage company (Series B, RevOps of 4) who cut prospecting time by 60%.

Best,
[Your Name]`,
  rationale: "RevOps scaling angle with direct tech stack reference builds instant credibility",
  flag: 1 as const,
};

const MOCK_MEETING = {
  title: "RevOps AI Demo — Outreach AI x [Company]",
  date: "Thursday, May 14, 2026",
  time: "10:00 AM PST",
  duration: "20 minutes",
  attendee: "",
  confirmed: false,
};

const INITIAL_HISTORY: HistoryItem[] = [
  {
    id: "h1",
    type: "email",
    date: "May 15, 2026 · 9:42 AM",
    subject: "AI-powered RevOps that fits your Salesforce + Outreach stack",
    status: "sent",
    children: [
      { id: "h1-c1", type: "reply", date: "May 16, 2026 · 10:12 AM", classification: "positive", replyPreview: "Thanks for reaching out! This looks really interesting. Can we schedule a quick call this week?" },
    ],
  },
  { id: "h2", type: "meeting", date: "May 20, 2026 · 3:00 PM IST", title: "Discovery call — Q2 RevOps priorities", duration: "30 min", meetLink: "meet.google.com/abc-defg-hij", meetingStatus: "completed" },
  { id: "h3", type: "email", date: "Apr 30, 2026 · 11:15 AM", subject: "Quick intro — AI prospecting for your Salesforce stack", status: "failed" },
];

// ─── Intent classifier ─────────────────────────────────────────────────────────
async function classifyIntent(text: string): Promise<string> {
  try {
    const res = await fetch("http://localhost:8080/api/classify-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });
    const data = await res.json();
    return data.intent || "default";
  } catch {
    return "default";
  }
}

// ─── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  // ── Profile & criteria (permanent in left panel) ──
  const [userId, setUserId] = useState<string>(() => {
    return localStorage.getItem("user_id") || "";
  });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => !!localStorage.getItem("user_id"));
  const [savedProfile, setSavedProfile] = useState<YourProfile | null>(null);

  const [savedCriteria, setSavedCriteria] = useState<FindLeadsCriteria | null>(null);

  // ── Lead form (manual entry) ──
  const [leadData, setLeadData] = useState<LeadData>({ name: "", email: "", company: "", website: "", linkedin: "" });

  // ── Chat state ──
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingStage, setTypingStage] = useState("Coordinator routing...");
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeAgent, setActiveAgent] = useState<"coordinator" | "research" | "messaging" | null>(null);
  const [lastTool, setLastTool] = useState<string | null>(null);

  // ── Email / meeting state ──
  const [emailDraft, setEmailDraft] = useState<EmailDraft | null>(null);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [followUpChips, setFollowUpChips] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (!userId) return;
    fetch(`http://localhost:8080/api/history/user/${userId}`)
      .then(r => r.json())
      .then((data: any[]) => {
        const mapped = data.map(item => ({
          id: item.id,
          type: (item.type === "meeting" ? "meeting" : item.reply_text ? "reply" : "email") as "email" | "meeting" | "reply",
          date: new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }),
          subject: item.subject || item.summary,
          status: item.status === "success" ? "sent" : "failed" as "sent" | "failed",
          title: item.summary,
          meetLink: item.event_link,
          meetingStatus: item.type === "meeting" ? "completed" as const : undefined,
          classification: item.reply_classification?.toLowerCase() as "positive" | "neutral" | "negative" | undefined,
          replyPreview: item.reply_text?.slice(0, 120),
        }));
        setHistory(mapped);
      })
      .catch(() => setHistory([]));
  }, [userId]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [leftWidth, setLeftWidth] = useState(320);
  const [rightWidth, setRightWidth] = useState(320);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useEffect(() => {
    fetch(`http://localhost:8080/api/approvals/${userId}`)
      .then(r => r.json())
      .then((data: any[]) => setNotificationCount(data.length))
      .catch(() => setNotificationCount(0));
  }, []);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8080/ws/${userId}`);

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === "reply_received") {
        setNotificationCount(prev => prev + 1);
      }

      if (msg.type === "meeting_booked") {
        const data = msg.data;
        addMessage({
          kind: "agent",
          id: generateId(),
          agent: "messaging",
          text: `Meeting booked with ${data.lead_name}! 🎉\n\nDate: ${data.start_time}\nDuration: ${data.duration} minutes\nMeet Link: ${data.meet_link}`,
          timestamp: now()
        });
        setHistory(prev => [{
          id: generateId(),
          type: "meeting",
          date: "Today · " + now(),
          title: `Meeting with ${data.lead_name}`,
          meetLink: data.meet_link,
          meetingStatus: "upcoming"
        }, ...prev]);
      }

      if (msg.type === "followup_pending") {
        const data = msg.data;
        setNotificationCount(prev => prev + 1);
      }
    };

    ws.onerror = (e) => console.error("WebSocket error:", e);

    return () => ws.close();
  }, []);
  // ── Lead profile modal ──
  const [profileModalLead, setProfileModalLead] = useState<LeadProfile | null>(null);
  const [foundLeads, setFoundLeads] = useState<LeadItem[]>([]);
  // ─── Helpers ──────────────────────────────────────────────────────────────────
  const addMessage = useCallback((msg: MessageType) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const runTyping = async (stages: string[], durationMs: number) => {
    setIsTyping(true);
    const delay = Math.floor(durationMs / stages.length);
    for (const stage of stages) {
      setTypingStage(stage);
      await new Promise(r => setTimeout(r, delay));
    }
  };

  // ─── Main send handler ────────────────────────────────────────────────────────
  const handleSend = async (text: string) => {
    addMessage({ kind: "user", id: generateId(), text, timestamp: now() });

    // Activate session + typing IMMEDIATELY before anything else
    if (!sessionActive) {
      setSessionActive(true);
      setSessionId("sess-" + generateId());
    }
    setIsTyping(true);
    setTypingStage("Coordinator routing...");

    const intent = await classifyIntent(text);
    
    // Build context string from saved profile + criteria (auto-injected to LLM)
    const _context = [
      savedProfile ? `Sender: ${savedProfile.name} at ${savedProfile.company}. Sells: ${savedProfile.whatYouSell}.` : "",
      savedCriteria
        ? `ICP: ${savedCriteria.jobRoles.join(", ")} in ${savedCriteria.industries.join(", ")}, ${savedCriteria.companySize} employees, ${savedCriteria.geography}.`
        : "",
    ].filter(Boolean).join(" ");

    // Choose typing stages
    const stages = intent === "research" || intent === "find-leads" ? (intent === "find-leads" ? STAGES_FIND : STAGES_RESEARCH) : STAGES_MESSAGING;
    const duration = intent === "research" ? 3800 : intent === "find-leads" ? 4000 : 2600;

    await runTyping(stages, duration);
    //setIsTyping(false);
    // ── Earlier leads intent ──
    // ── Analytics intent ──
    if (/analytics|data|conversion|how many|stats|performance|leads converted|report|metrics/i.test(text)) {
      setIsTyping(false);
      addMessage({ kind: "analytics", id: generateId(), timestamp: now() });
      return;
    }
    if (
      intent === "find-leads" &&
      /earlier|previous|old|last|before|again|same|overall|found|discovered|so far|all leads|entire|complete list/i.test(text)
    ) {
      
      try {
        const res = await fetch(`http://localhost:8080/api/leads/history/${userId}`);
        const data = await res.json();
        if (data.leads?.length > 0) {
          const leads: LeadItem[] = data.leads.map((l: any) => ({
            id: l.id,
            name: l.name,
            title: l.designation || l.job_role,
            company: l.company,
            email: l.email,
            phone: l.phone,
            linkedin: l.linkedin_url,
            status: l.lead_status as "new" | "contacted" | "replied" | "cold",
            techStack: (() => {
              try { return l.tech_stack ? JSON.parse(l.tech_stack) : []; }
              catch { return []; }
            })(),
            companySummary: l.company_summary,
          }));
          setFoundLeads(leads);
          addMessage({
            kind: "lead-list",
            id: generateId(),
            leads,
            criteria: data.criteria || "Previously found leads",
            timestamp: now(),
          });
        } else {
          addMessage({
            kind: "agent",
            id: generateId(),
            agent: "coordinator",
            text: "No previous lead searches found.",
            timestamp: now(),
          });
        }
      } catch {
        addMessage({
          kind: "agent",
          id: generateId(),
          agent: "coordinator",
          text: "Could not fetch earlier leads.",
          timestamp: now(),
        });
      }finally {
    setIsTyping(false);  // ← moved here — stops AFTER API completes
  }
      return;
    }
    // ── Intent handlers ────────────────────────────────────────────────────────
    if (intent === "find-leads") {
    setActiveAgent("research");
    setLastTool("search_leads_tool");
    const industries = savedCriteria?.industries || [];
    const jobRoles = savedCriteria?.jobRoles || [];
    const size = savedCriteria?.companySize || null;
    const geo = savedCriteria?.geography || null;
    const hasProduct =
      !!savedProfile?.whatYouSell;

    const hasIndustries =
      industries.length > 0;

    const hasRoles =
      jobRoles.length > 0;

    if (!hasProduct || !hasIndustries || !hasRoles) {

      try {

        const currentSessionId =
          sessionId || "sess-" + generateId();

        if (!sessionId) {
          setSessionId(currentSessionId);
        }

        const recentConversation = messages
          .slice(-8)
          .map((m) => {

            const role =
              m.kind === "user"
                ? "User"
                : "Assistant";

            return `${role}: ${
              "text" in m && typeof m.text === "string"
                ? m.text
                : ""
            }`;

          })
          .join("\n");

        const result = await api.runAgent({
          user_id: userId,
          session_id: currentSessionId,

          message: `
        ${recentConversation}

        User: ${text}
        `,

          flag: 0,

          context: {
            sender_profile: savedProfile || null,
            icp: savedCriteria || null,
          }
        });

        const response = result.response;

        const responseText =
          typeof response === "string"
            ? response
            : response?.agent_response ||
              response?.message ||
              "I need a few more details.";

        if (!response?.leads?.length) {

          addMessage({
            kind: "agent",
            id: generateId(),
            agent: "coordinator",
            text: responseText,
            timestamp: now(),
          });

        }
        if (response?.leads?.length) {

          const leads: LeadItem[] = response.leads.map((l: any) => ({
            id: l.id,
            name: l.name,
            title: l.designation || l.job_role,
            company: l.company,
            email: l.email,
            phone: l.phone,
            linkedin: l.linkedin_url,
            status: l.lead_status as
              | "new"
              | "contacted"
              | "replied"
              | "cold",

            techStack: (() => {
              try {
                return l.tech_stack
                  ? JSON.parse(l.tech_stack)
                  : [];
              } catch {
                return [];
              }
            })(),

            companySummary: l.company_summary,
          }));

          setFoundLeads(leads);

          addMessage({
            kind: "lead-list",
            id: generateId(),
            leads,
            criteria:
              response.criteria ||
              `${jobRoles.join(", ")} in ${industries.join(", ")}`,
            timestamp: now(),
          });
        }


      } catch {

        addMessage({
          kind: "agent",
          id: generateId(),
          agent: "coordinator",
          text: "Something went wrong.",
          timestamp: now(),
        });

      } finally {

        setIsTyping(false);
      }

      return;
    }

    try {
      const result = await api.searchLeads({
        user_id: userId,
        industries,
        job_roles: jobRoles,
        company_size: savedCriteria?.companySize || null,
        geography: savedCriteria?.geography || null,
        limit: savedCriteria?.limit || 20
});

      const leads: LeadItem[] = (result.leads || []).map((l: any) => ({
        id: l.id,
        name: l.name,
        title: l.designation || l.job_role,
        company: l.company,
        email: l.email,
        phone: l.phone,
        linkedin: l.linkedin_url,
        status: l.lead_status as "new" | "contacted" | "replied" | "cold",
        techStack: (() => {
            try { return l.tech_stack ? JSON.parse(l.tech_stack) : []; }
            catch { return []; }
          })(),
        companySummary: l.company_summary,
      }));

      setFoundLeads(leads);
      addMessage({
        kind: "agent", id: generateId(), agent: "research",
        text: `Found ${leads.length} leads matching your criteria.`,
        timestamp: now(),
      });
      setIsTyping(false);
      setTimeout(() => {
        addMessage({
          kind: "lead-list", id: generateId(),
          leads,
          criteria: `${jobRoles.join(", ")} in ${industries.join(", ")} · ${geo || "All"} · ${size}`,
          timestamp: now(),
        });
      }, 300);
    } catch (e) {
      addMessage({
        kind: "agent", id: generateId(), agent: "coordinator",
        text: "Failed to fetch leads. Please try again.",
        timestamp: now(),
      });
    } finally {
      setIsTyping(false);
    }
    } else {
  // All other intents go through real /run endpoint
  const agentType = intent === "research" ? "research" : "messaging";
  setActiveAgent(agentType);
  setLastTool(intent === "research" ? "scrape_tool" : "gmail_tool");

  try {
    const currentSessionId = sessionId || "sess-" + generateId();
    if (!sessionId) setSessionId(currentSessionId);

    const contextPrefix = [
  savedProfile
    ? `[User profile: I am ${savedProfile.name} from ${savedProfile.company}, selling ${savedProfile.whatYouSell}.]`
    : "",
  savedCriteria
  ? `ICP: ${savedCriteria.jobRoles.join(", ")} in ${savedCriteria.industries.join(", ")}, ${savedCriteria.companySize} employees, ${savedCriteria.geography}.`
  : "",
].filter(Boolean).join(" ");

const result = await api.runAgent({
      user_id: userId,
      session_id: currentSessionId,
      message: contextPrefix ? `${contextPrefix}\n\n${text}` : text,
      flag: 0,
      context: {
        name: leadData.name || savedProfile?.name || "",
        email: leadData.email || savedProfile?.email || "",
        company_name: leadData.company || savedProfile?.company || "",
        company_website: leadData.website || "",
        company_summary: leadData.companySummary || "",
        tech_stack: leadData.techStack || "",
      }
    });

    const response = result.response;
    const author = result.author || "coordinator";
    const agentName: "coordinator" | "research" | "messaging" =
      author.includes("research") ? "research"
      : author.includes("messaging") ? "messaging"
      : "coordinator";

    setActiveAgent(agentName);

    const responseText = typeof response === "string"
      ? response
      : response?.agent_response
      || response?.raw_response
      || (typeof response === "object" ? JSON.stringify(response) : String(response));
    addMessage({
      kind: "agent",
      id: generateId(),
      agent: agentName,
      text: responseText,
      timestamp: now(),
    });

    // If email draft in response
    if (response?.personalized_message) {
      const draft = {
        subject: "Personalized Outreach",
        body: response.personalized_message,
        rationale: response.rationale || "",
        flag: 1 as const,
      };
      setEmailDraft(draft);
      setTimeout(() => {
        addMessage({ kind: "email-draft", id: generateId(), draft, timestamp: now() });
        setPendingApproval(true);
        setFollowUpChips(["Send this email now", "Make it shorter", "More casual tone"]);
      }, 300);
    }

  } catch (e) {
    addMessage({
      kind: "agent", id: generateId(), agent: "coordinator",
      text: "Something went wrong. Please try again.",
      timestamp: now(),
    });
  } finally {
    setIsTyping(false);
  }
}
};
    

  // ─── Meeting confirm ───────────────────────────────────────────────────────
  const handleConfirmMeeting = (msgId: string) => {
    setMessages(prev => prev.map(m =>
      m.kind === "meeting" && m.id === msgId
        ? { ...m, proposal: { ...m.proposal, confirmed: true, meetLink: `meet.google.com/${generateId().slice(0,3)}-${generateId().slice(0,4)}-${generateId().slice(0,3)}` } }
        : m
    ));
    setTimeout(() => {
      addMessage({ kind: "agent", id: generateId(), agent: "messaging", text: "Meeting booked successfully! A calendar invite has been sent to both parties.", timestamp: now() });
      setHistory(prev => [{ id: generateId(), type: "meeting", date: "Today · " + now(), title: MOCK_MEETING.title, duration: MOCK_MEETING.duration, meetLink: "meet.google.com/new-link", meetingStatus: "upcoming" }, ...prev]);
    }, 300);
  };

  // ─── Bulk email flow ───────────────────────────────────────────────────────
  const handleGenerateBulkEmails = async (leads: LeadItem[]) => {
    if (leads.length === 0) return;
    await runTyping(STAGES_BULK, 3000);
    // DON'T stop typing here — keep it running until API completes

    // Generate preview emails from backend

    // Generate preview emails from backend
    let personalizedEmails: Record<string, { subject: string; body: string }> = {};
    try {
      const previewResult = await fetch("http://localhost:8080/api/preview-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          lead_ids: leads.map(l => l.id),
          sender_product: savedProfile?.whatYouSell || ""
        })
      }).then(r => r.json());

      if (previewResult.emails) {
        personalizedEmails = previewResult.emails;
      }
    } catch (e) {
      console.error("Preview generation failed", e);
    }

    const previewLeads: BriefLead[] = leads.map(l => ({
      id: l.id, name: l.name, email: l.email,
      initials: l.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
    }));

    setIsTyping(false); // ← Stop typing AFTER preview generation completes
    addMessage({
      kind: "bulk-approval", id: generateId(),
      leadCount: leads.length,
      subject: MOCK_EMAIL_DRAFT.subject,
      rationale: MOCK_EMAIL_DRAFT.rationale,
      previewLeads,
      timestamp: now(),
      sending: false, sent: false, progress: 0,
      personalizedEmails,
    });
  };

  const handleBulkApprove = async (msgId: string) => {
    setMessages(prev => prev.map(m =>
      m.kind === "bulk-approval" && m.id === msgId
        ? { ...m, sending: true, progress: 0 }
        : m
    ));

    try {
      let campaignId = null;
      try {
        const campaignResult = await fetch("http://localhost:8080/api/campaigns/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            name: `Outreach ${new Date().toLocaleDateString()}`,
            target_criteria: {},
            lead_ids: (() => {
              const approvalMsg = messages.find(m => m.kind === "bulk-approval" && m.id === msgId);
              return approvalMsg && approvalMsg.kind === "bulk-approval"
                ? approvalMsg.previewLeads.map(l => l.id)
                : foundLeads.map(l => l.id);
            })()
          })
        }).then(r => r.json());
        console.log("Campaign result:", campaignResult);
        campaignId = campaignResult.campaign_id;
      } catch {}

      const result = await api.bulkOutreach({
        user_id: userId,
        campaign_id: campaignId,
        lead_ids: (() => {
          const approvalMsg = messages.find(m => m.kind === "bulk-approval" && m.id === msgId);
          return approvalMsg && approvalMsg.kind === "bulk-approval"
            ? approvalMsg.previewLeads.map(l => l.id)
            : foundLeads.map(l => l.id);
        })(),
        email_subject: null,
        email_body: savedProfile?.whatYouSell || "",
        rationale: null
      });

      setMessages(prev => prev.map(m =>
        m.kind === "bulk-approval" && m.id === msgId
          ? { ...m, sending: false, sent: result.sent > 0, progress: 1 }
          : m
      ));

      addMessage({
        kind: "agent",
        id: generateId(),
        agent: "messaging",
        text: `Bulk outreach complete! ${result.sent} emails sent, ${result.failed} failed. Each email was personalized based on company data.`,
        timestamp: now(),
      });

    } catch (e) {
      setMessages(prev => prev.map(m =>
        m.kind === "bulk-approval" && m.id === msgId
          ? { ...m, sending: false }
          : m
      ));
      addMessage({
        kind: "agent",
        id: generateId(),
        agent: "coordinator",
        text: "Bulk send failed. Please try again.",
        timestamp: now(),
      });
    }
  };

  // ─── Follow-up actions ─────────────────────────────────────────────────────
  const handleApproveFollowup = (msgId: string) => {
    setMessages(prev => prev.filter(m => m.id !== msgId));
    addMessage({ kind: "agent", id: generateId(), agent: "messaging", text: "Follow-up email sent! I'll notify you when the lead responds.", timestamp: now() });
    setTimeout(() => addMessage({ kind: "email-sent", id: generateId(), messageId: "fu-" + generateId(), timestamp: now() }), 300);
  };

  const handleSkipFollowup = (msgId: string) => {
    setMessages(prev => prev.filter(m => m.id !== msgId));
    addMessage({ kind: "system", id: generateId(), text: "Follow-up skipped for this lead.", timestamp: now() });
  };

  // ─── Lead profile modal ────────────────────────────────────────────────────
  const handleViewLeadProfile = (lead: LeadItem) => {
    setProfileModalLead({
      id: lead.id, name: lead.name, title: lead.title, company: lead.company,
      email: lead.email, phone: lead.phone, linkedin: lead.linkedin,
      status: lead.status, techStack: lead.techStack, companySummary: lead.companySummary,
      enriching: false,
    });
  };

  const handleViewLeadHistory = (lead: LeadItem) => {
  addMessage({
    kind: "lead-history",
    id: generateId(),
    lead,
    timestamp: now(),
  });
};

  // ─── Approve / decline ─────────────────────────────────────────────────────
  const handleApprove = () => { setPendingApproval(false); handleSend("Send the email now"); };
  const handleDecline = () => {
    setPendingApproval(false);
    addMessage({ kind: "system", id: generateId(), text: "Email send cancelled by user.", timestamp: now() });
  };
  if (!isLoggedIn) {
    return (
      <LoginPage
        onLogin={(uid, token) => {
          setUserId(uid);
          setIsLoggedIn(true);
        }}
      />
    );
  }

   return (
    <div style={{ width: "100vw", height: "100vh", background: "#080B18", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "Inter, sans-serif" }}>
      {/* Lead Profile Modal */}
      {profileModalLead && (
        <LeadProfileModal lead={profileModalLead} onClose={() => setProfileModalLead(null)} />
      )}

      <TopNav sessionActive={sessionActive} sessionId={sessionId} notificationCount={notificationCount} />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left Panel — permanent profile + manual/find tabs */}
        <LeadPanel
          leadData={leadData}
          onLeadChange={setLeadData}
          activeAgent={activeAgent}
          lastTool={lastTool}
          sidebarCollapsed={sidebarCollapsed}
          onSidebarToggle={() => setSidebarCollapsed(prev => !prev)}
          onProfileSave={async (profile) => {
            setSavedProfile(profile);
            // if (profile.email) {
            //   localStorage.setItem("user_id", profile.email);
            //   setUserId(profile.email);
            // }
            try {
              await api.saveProfile({
                user_id: profile.email || userId,
                name: profile.name,
                email: profile.email,
                company: profile.company,
                product_service: profile.whatYouSell,
                updated_at: new Date().toISOString()
              });
            } catch (e) {
              console.error("Profile save failed", e);
            }
          }}
          onCriteriaSave={setSavedCriteria}
          initialProfile={savedProfile}
          initialCriteria={savedCriteria}
        />

        {/* Center — Chat */}
        <ChatPanel
          messages={messages}
          isTyping={isTyping}
          typingStage={typingStage}
          followUpChips={followUpChips}
          onSend={handleSend}
          onChipClick={() => {}}
          onConfirmMeeting={handleConfirmMeeting}
          onSendEmailFromCard={() => handleSend("Send the email now")}
          onRefineMessage={() => handleSend("Refine the message to be more concise and add a P.S. line")}
          onGenerateBulkEmails={handleGenerateBulkEmails}
          onBulkApprove={handleBulkApprove}
          onApproveFollowup={handleApproveFollowup}
          onSkipFollowup={handleSkipFollowup}
          onViewLeadProfile={handleViewLeadProfile}
          onViewLeadHistory={handleViewLeadHistory}
          onBookMeetingFromReply={(name) => handleSend(`Book a meeting with ${name}`)}
        />

        {/* Right Panel — Actions / History / Campaigns */}
        <ActionHistoryPanel
          emailDraft={emailDraft}
          pendingApproval={pendingApproval}
          leadEmail={leadData.email}
          onSendEmail={() => handleSend("Send the email now")}
          onBookMeeting={() => handleSend("Book a meeting with this lead")}
          onApprove={handleApprove}
          onDecline={handleDecline}
          onQuickAction={handleSend}
          history={history}
          leads={foundLeads}
        />
      </div>
    </div>
  );
}

