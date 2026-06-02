import { useState, useRef, useEffect } from "react";
import {
  Send, Paperclip, Clock, X, Copy, Edit3, CheckCircle2,
  Mail, Calendar, Video, ExternalLink, ArrowRight, Zap, Search, MessageSquare,
  ChevronRight, Phone, Linkedin, Building2, Check, Brain, AlertTriangle
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
export type AgentType = "coordinator" | "research" | "messaging";

export interface EmailDraftMessage {
  subject: string;
  body: string;
  rationale: string;
  flag: 0 | 1 | 2;
}

export interface MeetingProposal {
  title: string;
  date: string;
  time: string;
  duration: string;
  attendee: string;
  confirmed: boolean;
  meetLink?: string;
}

export interface LeadItem {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone?: string;
  linkedin?: string;
  status: "new" | "contacted" | "replied" | "cold" | "closed";
  techStack?: string[];
  companySummary?: string;
}

export interface BriefLead {
  id: string;
  name: string;
  email: string;
  initials: string;
}

export type MessageType =
  | { kind: "user"; id: string; text: string; timestamp: string }
  | { kind: "agent"; id: string; agent: AgentType; text: string; timestamp: string }
  | { kind: "email-draft"; id: string; draft: EmailDraftMessage; timestamp: string }
  | { kind: "meeting"; id: string; proposal: MeetingProposal; timestamp: string }
  | { kind: "email-sent"; id: string; messageId: string; timestamp: string }
  | { kind: "system"; id: string; text: string; timestamp: string }
  | { kind: "typing"; id: string; stage: string }
  | { kind: "lead-list"; id: string; leads: LeadItem[]; criteria: string; timestamp: string }
  | { kind: "bulk-approval"; id: string; leadCount: number; subject: string; rationale: string; previewLeads: BriefLead[]; timestamp: string; sending: boolean; sent: boolean; progress: number; personalizedEmails?: Record<string, { subject: string; body: string }> }
  | { kind: "followup-pending"; id: string; leadName: string; leadEmail: string; followupNum: number; totalFollowups: number; subject: string; body: string; scheduledTime: string; campaign: string; timestamp: string }
  | { kind: "analytics"; id: string; timestamp: string }
  | { kind: "lead-history"; id: string; lead: LeadItem; timestamp: string }
  | { kind: "reply-received"; id: string; leadName: string; leadEmail: string; classification: "positive" | "neutral" | "negative"; replyText: string; replyDate: string; timestamp: string };

interface ChatPanelProps {
  messages: MessageType[];
  isTyping: boolean;
  typingStage: string;
  followUpChips: string[];
  onSend: (text: string) => void;
  onChipClick: (text: string) => void;
  onConfirmMeeting: (id: string) => void;
  onSendEmailFromCard: () => void;
  onRefineMessage: (id: string) => void;
  onGenerateBulkEmails: (leads: LeadItem[]) => void;
  onBulkApprove: (msgId: string) => void;
  onApproveFollowup: (msgId: string) => void;
  onSkipFollowup: (msgId: string) => void;
  onViewLeadProfile: (lead: LeadItem) => void;
  onViewLeadHistory: (lead: LeadItem) => void;
  onBookMeetingFromReply: (leadName: string) => void;
}

const AGENT_CONFIG: Record<AgentType, { label: string; color: string; bgColor: string; borderColor: string; initial: string; tagline: string; icon: React.ReactNode }> = {
  coordinator: { label: "Coordinator", color: "rgba(255,255,255,0.55)", bgColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", initial: "C", tagline: "Routing your request", icon: <Zap size={10} /> },
  research: { label: "Research Agent", color: "#F07C2D", bgColor: "rgba(240,124,45,0.06)", borderColor: "rgba(240,124,45,0.2)", initial: "R", tagline: "Lead intelligence & personalization", icon: <Search size={10} /> },
  messaging: { label: "Messaging Agent", color: "#34D399", bgColor: "rgba(52,211,153,0.05)", borderColor: "rgba(52,211,153,0.18)", initial: "M", tagline: "Outreach, email & booking", icon: <MessageSquare size={10} /> },
};

const QUICK_ACTIONS = [
  { label: "Research lead", prompt: "Research this lead and find key insights" },
  { label: "Write email", prompt: "Generate a personalized outreach email" },
  { label: "Book meeting", prompt: "Book a meeting with this lead" },
  { label: "Check history", prompt: "Check past interactions with this lead" },
];

const LEAD_STATUS_CONFIG = {
  new: { label: "New", color: "rgba(255,255,255,0.5)", bg: "rgba(255,255,255,0.08)" },
  contacted: { label: "Contacted", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  replied: { label: "Replied", color: "#22C55E", bg: "rgba(34,197,94,0.12)" },
  cold: { label: "Cold", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
  closed: { label: "Closed", color: "#6B7280", bg: "rgba(107,114,128,0.12)" },
};


function AgentBadge({ agent }: { agent: AgentType }) {
  const cfg = AGENT_CONFIG[agent];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
      <div style={{ width: "22px", height: "22px", borderRadius: "6px", background: cfg.bgColor, border: `1px solid ${cfg.borderColor}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 700, color: cfg.color }}>
        {cfg.initial}
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ color: cfg.color, fontSize: "11px", fontWeight: 600 }}>{cfg.label}</span>
          <span style={{ color: cfg.color, opacity: 0.6 }}>{cfg.icon}</span>
        </div>
        <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "10px" }}>{cfg.tagline}</span>
      </div>
    </div>
  );
}

function UserBubble({ msg }: { msg: Extract<MessageType, { kind: "user" }> }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
      <div style={{ maxWidth: "70%" }}>
        <div style={{ background: "rgba(240,124,45,0.14)", border: "1px solid rgba(240,124,45,0.28)", borderRadius: "14px 14px 4px 14px", padding: "12px 16px", color: "#F0F1F5", fontSize: "14px", lineHeight: 1.65 }}>
          {msg.text}
        </div>
        <p style={{ color: "rgba(255,255,255,0.22)", fontSize: "11px", marginTop: "4px", textAlign: "right" }}>{msg.timestamp}</p>
      </div>
    </div>
  );
}

function AgentBubble({ msg }: { msg: Extract<MessageType, { kind: "agent" }> }) {
  if (msg.agent === "research") {
    return (
      <div style={{ marginBottom: "16px", maxWidth: "88%" }}>
        <AgentBadge agent={msg.agent} />
        <div style={{ background: "linear-gradient(135deg, rgba(240,124,45,0.07) 0%, rgba(30,34,48,0.95) 100%)", border: "1px solid rgba(240,124,45,0.2)", borderRadius: "4px 14px 14px 14px", padding: "14px 16px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: "linear-gradient(180deg, #F07C2D, rgba(240,124,45,0.2)", borderRadius: "3px 0 0 3px" }} />
          <p style={{ color: "#E4E6EC", fontSize: "14px", lineHeight: 1.7, paddingLeft: "4px", whiteSpace: "pre-wrap" }}>{msg.text}</p>
        </div>
        <p style={{ color: "rgba(255,255,255,0.22)", fontSize: "11px", marginTop: "5px" }}>{msg.timestamp}</p>
      </div>
    );
  }
  if (msg.agent === "messaging") {
    return (
      <div style={{ marginBottom: "16px", maxWidth: "88%" }}>
        <AgentBadge agent={msg.agent} />
        <div style={{ background: "linear-gradient(135deg, rgba(52,211,153,0.06) 0%, rgba(30,34,48,0.95) 100%)", border: "1px solid rgba(52,211,153,0.18)", borderRadius: "4px 14px 14px 14px", padding: "14px 16px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: "linear-gradient(180deg, #34D399, rgba(52,211,153,0.2))", borderRadius: "3px 0 0 3px" }} />
          <p style={{ color: "#E4E6EC", fontSize: "14px", lineHeight: 1.7, paddingLeft: "4px", whiteSpace: "pre-wrap" }}>{msg.text}</p>
        </div>
        <p style={{ color: "rgba(255,255,255,0.22)", fontSize: "11px", marginTop: "5px" }}>{msg.timestamp}</p>
      </div>
    );
  }
  return (
    <div style={{ marginBottom: "16px", maxWidth: "88%" }}>
      <AgentBadge agent={msg.agent} />
      <div style={{ background: "#111530", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "4px 14px 14px 14px", padding: "14px 16px" }}>
        <p style={{ color: "#C8CAD4", fontSize: "14px", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{msg.text}</p>
      </div>
      <p style={{ color: "rgba(255,255,255,0.22)", fontSize: "11px", marginTop: "5px" }}>{msg.timestamp}</p>
    </div>
  );
}

function EmailDraftCard({ msg, onSend, onRefine }: { msg: Extract<MessageType, { kind: "email-draft" }>; onSend: () => void; onRefine: () => void }) {
  const [copied, setCopied] = useState(false);
  const FLAG_LABELS: Record<0 | 1 | 2, { label: string; color: string; bg: string }> = {
    0: { label: "Drafting", color: "rgba(255,255,255,0.5)", bg: "rgba(255,255,255,0.08)" },
    1: { label: "Ready to Send", color: "#F07C2D", bg: "rgba(240,124,45,0.15)" },
    2: { label: "Sent", color: "#34D399", bg: "rgba(52,211,153,0.12)" },
  };
  const flagInfo = FLAG_LABELS[msg.draft.flag];
  return (
    <div style={{ marginBottom: "16px", maxWidth: "92%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
        <div style={{ width: "22px", height: "22px", borderRadius: "6px", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(240,124,45,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Mail size={11} color="#F07C2D" />
        </div>
        <span style={{ color: "#F07C2D", fontSize: "11px", fontWeight: 600 }}>Messaging Agent</span>
        <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "10px" }}>· Generated email draft</span>
      </div>
      <div style={{ background: "#0D1128", border: "1px solid rgba(240,124,45,0.22)", borderRadius: "4px 14px 14px 14px", overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "8px" }}>
          <Mail size={13} color="#F07C2D" />
          <span style={{ color: "#F07C2D", fontSize: "13px", fontWeight: 500, flex: 1 }}>Personalized Email Draft</span>
          <span style={{ background: flagInfo.bg, color: flagInfo.color, fontSize: "10px", fontWeight: 500, padding: "2px 8px", borderRadius: "20px" }}>{flagInfo.label}</span>
          <button onClick={() => { navigator.clipboard.writeText(`${msg.draft.subject}\n\n${msg.draft.body}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ background: "none", border: "none", cursor: "pointer", color: copied ? "#34D399" : "rgba(255,255,255,0.35)", padding: "2px" }}>
            {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
          </button>
          <button style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", padding: "2px" }}><Edit3 size={14} /></button>
        </div>
        <div style={{ padding: "12px 16px 0" }}>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Subject</p>
          <p style={{ color: "#F0F1F5", fontSize: "14px", fontWeight: 500 }}>{msg.draft.subject}</p>
        </div>
        <div style={{ margin: "10px 16px", background: "#111530", borderRadius: "8px", padding: "12px" }}>
          <p style={{ color: "#C8CAD4", fontSize: "13px", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{msg.draft.body}</p>
        </div>
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "8px" }}>
          <button onClick={onSend} style={{ background: "#F07C2D", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 500, padding: "8px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontFamily: "inherit", transition: "box-shadow 0.2s" }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(240,124,45,0.4)")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = "none")}
          >
            <Send size={13} /> Send Email
          </button>
          <button onClick={onRefine} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", color: "rgba(255,255,255,0.6)", fontSize: "13px", fontWeight: 500, padding: "8px 16px", cursor: "pointer", fontFamily: "inherit" }}>
            Refine Message
          </button>
        </div>
        {msg.draft.rationale && (
          <div style={{ padding: "0 16px 12px" }}>
            <span style={{ background: "rgba(240,124,45,0.08)", color: "#F07C2D", fontSize: "11px", fontStyle: "italic", padding: "4px 10px", borderRadius: "20px", display: "inline-block" }}>
              Why this angle: {msg.draft.rationale}
            </span>
          </div>
        )}
      </div>
      <p style={{ color: "rgba(255,255,255,0.22)", fontSize: "11px", marginTop: "5px" }}>{msg.timestamp}</p>
    </div>
  );
}

function MeetingCard({ msg, onConfirm }: { msg: Extract<MessageType, { kind: "meeting" }>; onConfirm: () => void }) {
  if (msg.proposal.confirmed && msg.proposal.meetLink) {
    return (
      <div style={{ marginBottom: "16px", maxWidth: "80%" }}>
        <div style={{ background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.22)", borderRadius: "12px", padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <CheckCircle2 size={16} color="#34D399" />
            <span style={{ color: "#34D399", fontSize: "14px", fontWeight: 500 }}>Meeting Confirmed</span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", marginBottom: "8px" }}>{msg.proposal.title}</p>
          <a href="#" style={{ color: "#F07C2D", fontSize: "13px", display: "flex", alignItems: "center", gap: "4px" }}>
            <Video size={13} /> {msg.proposal.meetLink}
          </a>
        </div>
      </div>
    );
  }
  return (
    <div style={{ marginBottom: "16px", maxWidth: "80%" }}>
      <div style={{ background: "#0D1128", border: "1px solid rgba(52,211,153,0.18)", borderRadius: "4px 14px 14px 14px", overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "8px" }}>
          <Calendar size={13} color="#34D399" />
          <span style={{ color: "#34D399", fontSize: "13px", fontWeight: 500 }}>Meeting Proposal</span>
        </div>
        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            { icon: Calendar, label: "Title", value: msg.proposal.title },
            { icon: Clock, label: "Date & Time", value: `${msg.proposal.date} at ${msg.proposal.time}` },
            { icon: Clock, label: "Duration", value: msg.proposal.duration },
            { icon: Mail, label: "Attendee", value: msg.proposal.attendee },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Icon size={13} color="rgba(255,255,255,0.3)" />
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", minWidth: "72px" }}>{label}:</span>
              <span style={{ color: "#E4E6EC", fontSize: "12px" }}>{value}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "8px" }}>
          <button onClick={onConfirm} style={{ background: "#22C55E", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 500, padding: "8px 16px", cursor: "pointer", flex: 1, fontFamily: "inherit" }}>Confirm Booking</button>
          <button style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", color: "rgba(255,255,255,0.6)", fontSize: "13px", fontWeight: 500, padding: "8px 16px", cursor: "pointer", fontFamily: "inherit" }}>Edit Details</button>
        </div>
      </div>
    </div>
  );
}

function EmailSentBanner({ msg }: { msg: Extract<MessageType, { kind: "email-sent" }> }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.18)", borderRadius: "10px", padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
        <CheckCircle2 size={16} color="#34D399" style={{ flexShrink: 0, marginTop: "1px" }} />
        <div>
          <p style={{ color: "#34D399", fontSize: "14px", fontWeight: 500 }}>Email sent successfully</p>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", fontFamily: "monospace", marginTop: "2px" }}>ID: {msg.messageId}</p>
          <a href="#" style={{ color: "#F07C2D", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>View in Gmail <ExternalLink size={11} /></a>
        </div>
      </div>
    </div>
  );
}

function SystemMessage({ msg }: { msg: Extract<MessageType, { kind: "system" }> }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", margin: "14px 0" }}>
      <div style={{ background: "rgba(240,124,45,0.07)", border: "1px solid rgba(240,124,45,0.14)", borderRadius: "20px", padding: "5px 14px", display: "flex", alignItems: "center", gap: "6px" }}>
        <ArrowRight size={11} color="#F07C2D" />
        <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px" }}>{msg.text}</span>
      </div>
    </div>
  );
}

function TypingIndicator({ stage }: { stage: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", marginBottom: "12px" }}>
      <div style={{ marginBottom: "6px" }}>
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", animation: "fadeInOut 1.5s ease-in-out infinite" }}>{stage}</span>
      </div>
      <div style={{ background: "#111530", borderRadius: "12px", padding: "12px 18px", display: "flex", gap: "5px", alignItems: "center" }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#F07C2D", animation: "bounce 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  );
}

// ─── V2: Lead List Card ────────────────────────────────────────────────────────
function LeadListCard({ msg, onGenerateBulkEmails, onViewProfile, onViewLeadHistory }: {
  msg: Extract<MessageType, { kind: "lead-list" }>;
  onGenerateBulkEmails: (leads: LeadItem[]) => void;
  onViewProfile: (lead: LeadItem) => void;
  onViewLeadHistory: (lead: LeadItem) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [emailsGenerated, setEmailsGenerated] = useState(false);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(prev => prev.size === msg.leads.length ? new Set() : new Set(msg.leads.map(l => l.id)));
  };

  const handleGenerate = () => {
    const leads = msg.leads.filter(l => selected.has(l.id));
    setEmailsGenerated(true);
    onGenerateBulkEmails(leads);
  };

  return (
    <div style={{ marginBottom: "16px", maxWidth: "95%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
        <div style={{ width: "22px", height: "22px", borderRadius: "6px", background: "rgba(240,124,45,0.1)", border: "1px solid rgba(240,124,45,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Search size={11} color="#F07C2D" />
        </div>
        <span style={{ color: "#F07C2D", fontSize: "11px", fontWeight: 600 }}>Research Agent</span>
        <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "10px" }}>· Lead discovery complete</span>
      </div>
      <div style={{ background: "#0D1128", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Search size={14} color="#F07C2D" />
            <span style={{ color: "#F07C2D", fontSize: "14px", fontWeight: 500, flex: 1 }}>Found {msg.leads.length} Leads</span>
            <button onClick={toggleAll} style={{ display: "flex", alignItems: "center", gap: "5px", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.45)", fontSize: "12px", fontFamily: "Inter, sans-serif" }}>
              <div style={{ width: "14px", height: "14px", borderRadius: "3px", border: selected.size === msg.leads.length ? "none" : "1px solid rgba(255,255,255,0.2)", background: selected.size === msg.leads.length ? "#F07C2D" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {selected.size === msg.leads.length && <Check size={9} color="#fff" />}
              </div>
              Select All
            </button>
            <span style={{ background: "rgba(240,124,45,0.15)", color: "#F07C2D", fontSize: "11px", padding: "2px 8px", borderRadius: "12px" }}>{selected.size} selected</span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px" }}>Matching: {msg.criteria}</p>
        </div>

        {/* Lead List */}
        <div style={{ maxHeight: "360px", overflowY: "auto" }}>
          {msg.leads.map((lead, i) => {
            const isSelected = selected.has(lead.id);
            const isExpanded = expanded === lead.id;
            const status = LEAD_STATUS_CONFIG[lead.status];
            const initials = lead.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
            const avatarColors = [
              { bg: "rgba(240,124,45,0.15)", color: "#F07C2D" },
              { bg: "rgba(34,197,94,0.15)", color: "#34D399" },
              { bg: "rgba(245,158,11,0.15)", color: "#F59E0B" },
            ][i % 3];

            return (
              <div key={lead.id} style={{ borderBottom: i < msg.leads.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <div
                  style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", background: isSelected ? "rgba(240,124,45,0.04)" : "transparent", transition: "background 0.15s" }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "#111530"; }}
                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  {/* Checkbox */}
                  <button onClick={() => toggleSelect(lead.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}>
                    <div style={{ width: "16px", height: "16px", borderRadius: "4px", border: isSelected ? "none" : "1px solid rgba(255,255,255,0.2)", background: isSelected ? "#F07C2D" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                      {isSelected && <Check size={10} color="#fff" />}
                    </div>
                  </button>

                  {/* Avatar */}
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: avatarColors.bg, color: avatarColors.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>
                    {initials}
                  </div>

                  {/* Name + Title */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: "#F0F1F5", fontSize: "13px", fontWeight: 500, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lead.name}</p>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", margin: "1px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lead.title}</p>
                  </div>

                  {/* Company */}
                  <span style={{ color: "#F07C2D", fontSize: "12px", flexShrink: 0 }}>{lead.company}</span>

                  {/* Status */}
                  <span style={{ background: status.bg, color: status.color, fontSize: "10px", fontWeight: 500, padding: "2px 7px", borderRadius: "20px", flexShrink: 0 }}>{status.label}</span>

                  {/* Chevron */}
                  <button onClick={() => setExpanded(isExpanded ? null : lead.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: "2px", flexShrink: 0 }}>
                    <ChevronRight size={14} style={{ transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
                  </button>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  // <div style={{ padding: "10px 16px 14px 60px", background: "#080B18", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  //   <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
                  //     <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  //       <Mail size={12} color="rgba(255,255,255,0.3)" />
                  //       <span style={{ color: "#F07C2D", fontSize: "12px" }}>{lead.email}</span>
                  //       <button onClick={() => navigator.clipboard.writeText(lead.email)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 0 }}><Copy size={11} /></button>
                  //     </div>
                  //     {lead.phone && (
                  //       <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  //         <Phone size={12} color="rgba(255,255,255,0.3)" />
                  //         <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "12px" }}>{lead.phone}</span>
                  //       </div>
                  //     )}
                  //     {lead.linkedin && (
                  //       <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  //         <Linkedin size={12} color="rgba(255,255,255,0.3)" />
                  //         <a href="#" style={{ color: "#F07C2D", fontSize: "12px" }}>{lead.linkedin}</a>
                  //       </div>
                  //     )}
                  //   </div>
                  //   {lead.companySummary && (
                  //     <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px", lineHeight: 1.6, marginBottom: "8px" }}>{lead.companySummary}</p>
                  //   )}
                  //   {lead.techStack && (
                  //     <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "8px" }}>
                  //       {lead.techStack.map(t => (
                  //         <span key={t} style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", fontSize: "11px", padding: "2px 7px", borderRadius: "5px" }}>{t}</span>
                  //       ))}
                  //     </div>
                  //   )}
                  //   <button onClick={() => onViewProfile(lead)} style={{ background: "none", border: "none", cursor: "pointer", color: "#F07C2D", fontSize: "12px", padding: 0, fontFamily: "Inter, sans-serif" }}>
                  //     View Full Profile →
                  //   </button>
                  // </div>
                  <div style={{ padding: "10px 16px 14px 60px", background: "#080B18", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <button onClick={() => onViewProfile(lead)} style={{ background: "none", border: "none", cursor: "pointer", color: "#F07C2D", fontSize: "12px", padding: 0, fontFamily: "Inter, sans-serif", textAlign: "left" }}>
                      View Full Profile →
                    </button>
                    {lead.status !== "new" && (
                      <button onClick={() => onViewLeadHistory(lead)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.45)", fontSize: "12px", padding: 0, fontFamily: "Inter, sans-serif", textAlign: "left" }}>
                        Past Interactions →
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0A0E1E" }}>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{selected.size} leads selected</span>
          <div style={{ display: "flex", gap: "8px" }}>
            {/* {emailsGenerated && (
              <button style={{ background: "#22C55E", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px", fontWeight: 500, padding: "7px 14px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                Send Emails Now
              </button>
            )} */}
            <button
              onClick={handleGenerate}
              disabled={selected.size === 0}
              style={{ background: selected.size > 0 ? "#F07C2D" : "rgba(240,124,45,0.3)", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px", fontWeight: 500, padding: "7px 14px", cursor: selected.size > 0 ? "pointer" : "not-allowed", fontFamily: "Inter, sans-serif", transition: "box-shadow 0.2s" }}
              onMouseEnter={e => { if (selected.size > 0) (e.currentTarget as HTMLElement).style.boxShadow = "0 0 16px rgba(240,124,45,0.3)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
            >
              Generate Emails for Selected →
            </button>
          </div>
        </div>
      </div>
      <p style={{ color: "rgba(255,255,255,0.22)", fontSize: "11px", marginTop: "5px" }}>{msg.timestamp}</p>
    </div>
  );
}

// ─── V2: Bulk Approval Card ───────────────────────────────────────────────────
function BulkApprovalCard({ msg, onApprove, onDecline }: {
  msg: Extract<MessageType, { kind: "bulk-approval" }>;
  onApprove: () => void;
  onDecline: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const visibleLeads = showAll ? msg.previewLeads : msg.previewLeads.slice(0, 3);
  const avatarColors = ["#F07C2D", "#34D399", "#F59E0B", "#60A5FA"];
  
  const [previewEmail, setPreviewEmail] = useState<{ name: string; email: string; subject: string; body: string } | null>(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [refineMode, setRefineMode] = useState(false);
  const [refineText, setRefineText] = useState("");
  const [refining, setRefining] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  return (
    <div style={{ marginBottom: "16px", maxWidth: "92%" }}>
      <div style={{ background: "rgba(240,124,45,0.07)", border: "1px solid rgba(240,124,45,0.25)", borderLeft: "3px solid #F07C2D", borderRadius: "12px", padding: "20px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Mail size={15} color="#F07C2D" />
            <span style={{ color: "#F07C2D", fontSize: "15px", fontWeight: 500 }}>Ready to Send to {msg.leadCount} Leads</span>
          </div>
          <span style={{ background: "rgba(240,124,45,0.15)", color: "#F07C2D", fontSize: "10px", fontWeight: 500, padding: "3px 10px", borderRadius: "20px" }}>Ready to Send</span>
        </div>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", marginBottom: "16px" }}>AI has personalized each email. Review before sending.</p>

        {/* Lead Preview */}
        <div style={{ background: "#0D1128", borderRadius: "8px", overflow: "hidden", marginBottom: "14px" }}>
          {visibleLeads.map((lead, i) => (
            <div key={lead.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderBottom: i < visibleLeads.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "rgba(124,92,252,0.2)", color: avatarColors[i % avatarColors.length], fontSize: "10px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {lead.initials}
              </div>
              <span style={{ color: "#F0F1F5", fontSize: "13px", fontWeight: 500, minWidth: "100px" }}>{lead.name}</span>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.email}</span>
              <button
              onClick={() => {
                const emailData = msg.personalizedEmails?.[lead.email];
                if (emailData) {
                  setPreviewEmail({ name: lead.name, email: lead.email, ...emailData });
                }
              }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#F07C2D", fontSize: "12px", flexShrink: 0, fontFamily: "Inter, sans-serif" }}
            >
              Preview ↗
            </button>
            </div>
          ))}
          {msg.previewLeads.length > 3 && !showAll && (
            <button onClick={() => setShowAll(true)} style={{ width: "100%", padding: "8px", background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "12px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
              Show all {msg.leadCount} leads
            </button>
          )}
        </div>

        {/* Subject
        <div style={{ marginBottom: "12px" }}>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Subject Template</p>
          <div style={{ background: "#252A3A", borderRadius: "6px", padding: "10px 12px" }}>
            <p style={{ color: "#E4E6EC", fontSize: "13px" }}>{msg.subject}</p>
          </div>
        </div> */}

        {/* Rationale */}
        {/* <div style={{ marginBottom: "16px" }}>
          <span style={{ background: "rgba(124,92,252,0.1)", color: "#F07C2D", fontSize: "11px", fontStyle: "italic", padding: "4px 10px", borderRadius: "20px", display: "inline-block" }}>
            💡 Why this angle: {msg.rationale}
          </span>
        </div> */}

        {/* Actions or Progress */}
        {msg.sent ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px", background: "rgba(34,197,94,0.08)", borderRadius: "8px" }}>
            <CheckCircle2 size={16} color="#34D399" />
            <span style={{ color: "#34D399", fontSize: "13px", fontWeight: 500 }}>All {msg.leadCount} emails sent successfully</span>
          </div>
        ) : msg.sending ? (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>Sending emails...</span>
              <span style={{ color: "#F07C2D", fontSize: "12px" }}>{Math.round(msg.progress * msg.leadCount)} / {msg.leadCount}</span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "4px", height: "6px" }}>
              <div style={{ background: "#F07C2D", height: "6px", borderRadius: "4px", width: `${msg.progress * 100}%`, transition: "width 0.3s ease" }} />
            </div>
          </div>
        ) : cancelled ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px", background: "rgba(239,68,68,0.08)", borderRadius: "8px" }}>
            <X size={16} color="#EF4444" />
            <span style={{ color: "#EF4444", fontSize: "13px", fontWeight: 500 }}>Outreach cancelled</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button onClick={onApprove} style={{ background: "#22C55E", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 500, padding: "10px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
              Approve & Send All
            </button>
           <button
              onClick={() => { setReviewMode(true); setReviewIndex(0); }}
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", color: "rgba(255,255,255,0.6)", fontSize: "13px", fontWeight: 500, padding: "10px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}
            >
              Review Each First
            </button>
            <button onClick={() => setCancelled(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", fontSize: "13px", fontFamily: "Inter, sans-serif", padding: "4px 0" }}>
              Cancel
            </button>
          </div>
        )}
      </div>
      <p style={{ color: "rgba(255,255,255,0.22)", fontSize: "11px", marginTop: "5px" }}>{msg.timestamp}</p>

      {/* Preview Modal */}
      {previewEmail && (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ background: "#0D1128", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "24px", width: "520px", maxHeight: "80vh", overflowY: "auto" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
        <div>
          <p style={{ color: "#F0F1F5", fontSize: "15px", fontWeight: 600 }}>{previewEmail.name}</p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{previewEmail.email}</p>
        </div>
        <button onClick={() => { setPreviewEmail(null); setRefineMode(false); setRefineText(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: "20px", fontFamily: "Inter, sans-serif" }}>✕</button>
      </div>

      {/*Subject */}
      <div style={{ background: "#1E2230", borderRadius: "8px", padding: "14px", marginBottom: "12px" }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", textTransform: "uppercase", marginBottom: "4px" }}>Subject</p>
        <p style={{ color: "#F0F1F5", fontSize: "14px", fontWeight: 500 }}>{previewEmail.subject}</p>
      </div>

      {/* Body */}
      <div style={{ background: "#1E2230", borderRadius: "8px", padding: "14px", marginBottom: "16px" }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", textTransform: "uppercase", marginBottom: "8px" }}>Body</p>
        <p style={{ color: "#C8CAD4", fontSize: "13px", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{previewEmail.body}</p>
      </div>

      {/* Refine input — shown when refineMode is true */}
      {refineMode && (
        <div style={{ marginBottom: "12px" }}>
          <textarea
            value={refineText}
            onChange={e => setRefineText(e.target.value)}
            placeholder="e.g. Make it shorter, more casual tone..."
            rows={2}
            style={{ width: "100%", background: "#1E2230", border: "1px solid rgba(240,124,45,0.4)", borderRadius: "8px", color: "#F0F1F5", fontSize: "13px", padding: "10px 12px", fontFamily: "Inter, sans-serif", resize: "none", outline: "none", boxSizing: "border-box" }}
          />
          <button
            disabled={refining || !refineText.trim()}
            onClick={async () => {
              setRefining(true);
              try {
                const userId = localStorage.getItem("user_id") || "";
                const res = await fetch("http://localhost:8080/api/approvals/bulk/refine", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    lead_email: previewEmail.email,
                    instruction: refineText,
                    current_subject: previewEmail.subject,
                    current_body: previewEmail.body,
                    user_id: userId
                  })
                });
                const data = await res.json();
                if (data.subject && data.body) {
                  setPreviewEmail(prev => prev ? { ...prev, subject: data.subject, body: data.body } : prev);
                  // update parent personalizedEmails map
                  if (msg.personalizedEmails) {
                    msg.personalizedEmails[previewEmail.email] = { subject: data.subject, body: data.body };
                  }
                }
                setRefineMode(false);
                setRefineText("");
              } catch (e) {
                console.error("Refine failed", e);
              } finally {
                setRefining(false);
              }
            }}
            style={{ marginTop: "8px", width: "100%", background: refining ? "rgba(124,92,252,0.5)" : "#F07C2D", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 500, padding: "10px", cursor: refining ? "not-allowed" : "pointer", fontFamily: "Inter, sans-serif" }}
          >
            {refining ? "Regenerating..." : "Regenerate Email"}
          </button>
        </div>
      )}

      {/* Footer buttons */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={() => { setRefineMode(r => !r); setRefineText(""); }}
          style={{ flex: 1, background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", color: "rgba(255,255,255,0.6)", fontSize: "13px", fontWeight: 500, padding: "10px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}
        >
          {refineMode ? "Cancel Refine" : "Refine"}
        </button>
        <button
          onClick={() => { setPreviewEmail(null); setRefineMode(false); setRefineText(""); }}
          style={{ flex: 1, background: "#F07C2D", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 500, padding: "10px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}
        >
          Close Preview
        </button>
      </div>

    </div>
  </div>
)}

      {/* Review Mode */}
      {reviewMode && msg.previewLeads[reviewIndex] && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#0D1128", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "24px", width: "520px", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>
                Reviewing {reviewIndex + 1} of {msg.previewLeads.length}
              </p>
              <button onClick={() => setReviewMode(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: "20px", fontFamily: "Inter, sans-serif" }}>✕</button>
            </div>
            {(() => {
              const lead = msg.previewLeads[reviewIndex];
              const emailData = msg.personalizedEmails?.[lead.email];
              return (
                <>
                  <div style={{ marginBottom: "12px" }}>
                    <p style={{ color: "#F0F1F5", fontSize: "15px", fontWeight: 600 }}>{lead.name}</p>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{lead.email}</p>
                  </div>
                  <div style={{ background: "#1E2230", borderRadius: "8px", padding: "14px", marginBottom: "12px" }}>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", textTransform: "uppercase", marginBottom: "4px" }}>Subject</p>
                    <p style={{ color: "#F0F1F5", fontSize: "14px", fontWeight: 500 }}>{emailData?.subject || "—"}</p>
                  </div>
                  <div style={{ background: "#1E2230", borderRadius: "8px", padding: "14px", marginBottom: "16px" }}>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", textTransform: "uppercase", marginBottom: "8px" }}>Body</p>
                    <p style={{ color: "#C8CAD4", fontSize: "13px", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{emailData?.body || "No preview available"}</p>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {reviewIndex > 0 && (
                      <button onClick={() => setReviewIndex(i => i - 1)} style={{ flex: 1, background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", color: "rgba(255,255,255,0.6)", fontSize: "13px", padding: "10px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                        ← Previous
                      </button>
                    )}
                    {reviewIndex < msg.previewLeads.length - 1 ? (
                      <button onClick={() => setReviewIndex(i => i + 1)} style={{ flex: 1, background: "#F07C2D", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 500, padding: "10px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                        Next →
                      </button>
                    ) : (
                      <button onClick={() => { setReviewMode(false); onApprove(); }} style={{ flex: 1, background: "#22C55E", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 500, padding: "10px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                        Approve & Send All
                      </button>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── V2: Follow-up Pending Card ────────────────────────────────────────────────
function FollowupPendingCard({ msg, onApprove, onSkip }: {
  msg: Extract<MessageType, { kind: "followup-pending" }>;
  onApprove: () => void;
  onSkip: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ marginBottom: "16px", maxWidth: "88%" }}>
      <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderLeft: "3px solid #F59E0B", borderRadius: "10px", padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <Clock size={15} color="#F59E0B" />
          <span style={{ color: "#F59E0B", fontSize: "14px", fontWeight: 500 }}>Follow-up Ready</span>
          <span style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B", fontSize: "10px", fontWeight: 500, padding: "2px 8px", borderRadius: "20px", marginLeft: "auto" }}>
            Follow-up #{msg.followupNum} of {msg.totalFollowups}
          </span>
        </div>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px", marginBottom: "12px" }}>
          No reply received in {msg.followupNum * 3} days from <span style={{ color: "#F0F1F5" }}>{msg.leadName}</span> · <span style={{ color: "rgba(255,255,255,0.5)" }}>{msg.leadEmail}</span>
        </p>

        {/* Email Preview */}
        <div style={{ background: "#0D1128", borderRadius: "8px", padding: "10px 12px", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
            <p style={{ color: "#F0F1F5", fontSize: "13px", fontWeight: 500 }}>{msg.subject}</p>
            <button onClick={() => setExpanded(!expanded)} style={{ background: "none", border: "none", cursor: "pointer", color: "#F07C2D", fontSize: "11px", fontFamily: "Inter, sans-serif" }}>
              {expanded ? "Collapse" : "Expand"}
            </button>
          </div>
          {expanded && (
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "12px", lineHeight: 1.65, marginTop: "8px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px" }}>
              {msg.body}
            </p>
          )}
        </div>

        {/* Timing */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "12px" }}>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px" }}>
            Scheduled for: <span style={{ color: "rgba(255,255,255,0.6)" }}>{msg.scheduledTime}</span>
          </p>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px" }}>
            Campaign: <span style={{ color: "rgba(255,255,255,0.6)" }}>{msg.campaign}</span>
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button onClick={onApprove} style={{ background: "#F59E0B", border: "none", borderRadius: "8px", color: "#000", fontSize: "13px", fontWeight: 600, padding: "8px 16px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
            Approve & Send
          </button>
          <button style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", color: "rgba(255,255,255,0.6)", fontSize: "13px", fontWeight: 500, padding: "8px 14px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
            Edit Email
          </button>
          <button onClick={onSkip} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", fontSize: "13px", fontFamily: "Inter, sans-serif", padding: "4px" }}>
            Skip this lead
          </button>
        </div>
      </div>
      <p style={{ color: "rgba(255,255,255,0.22)", fontSize: "11px", marginTop: "5px" }}>{msg.timestamp}</p>
    </div>
  );
}

// ─── V2: Reply Received Card ───────────────────────────────────────────────────
function ReplyReceivedCard({ msg, onBookMeeting }: {
  msg: Extract<MessageType, { kind: "reply-received" }>;
  onBookMeeting: () => void;
}) {
  const cfg = {
    positive: { border: "#22C55E", bg: "rgba(34,197,94,0.07)", badgeBg: "rgba(34,197,94,0.15)", badgeColor: "#22C55E", suggestion: "Lead is ready to talk. Book a meeting now.", primaryBtn: "Book Meeting Now", primaryBg: "#22C55E", primaryColor: "#fff" },
    neutral: { border: "#F59E0B", bg: "rgba(245,158,11,0.07)", badgeBg: "rgba(245,158,11,0.15)", badgeColor: "#F59E0B", suggestion: "Lead wants contact in 30 days. Schedule re-engagement.", primaryBtn: "Schedule Re-engagement", primaryBg: "#F59E0B", primaryColor: "#000" },
    negative: { border: "#EF4444", bg: "rgba(239,68,68,0.07)", badgeBg: "rgba(239,68,68,0.15)", badgeColor: "#EF4444", suggestion: "Lead not interested. Mark as closed.", primaryBtn: "Close Lead", primaryBg: "transparent", primaryColor: "#EF4444" },
  }[msg.classification];

  const initials = msg.leadName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{ marginBottom: "16px", maxWidth: "88%", animation: "slideInUp 0.3s ease-out" }}>
      <div style={{ background: cfg.bg, border: `1px solid ${cfg.border}40`, borderRadius: "12px", padding: "16px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: cfg.badgeBg, color: cfg.badgeColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#F0F1F5", fontSize: "13px", fontWeight: 500 }}>Reply from {msg.leadName}</span>
              <span style={{ background: cfg.badgeBg, color: cfg.badgeColor, fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{msg.classification}</span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", marginTop: "2px" }}>{msg.replyDate}</p>
          </div>
        </div>

        {/* Reply Text */}
        <div style={{ background: "#161B30", borderRadius: "8px", padding: "12px", marginBottom: "12px" }}>
          <p style={{ color: "#D4D6E0", fontSize: "13px", lineHeight: 1.7 }}>{msg.replyText}</p>
        </div>

        {/* LLM Suggestion */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "14px" }}>
          <Brain size={14} color={cfg.badgeColor} style={{ flexShrink: 0, marginTop: "1px" }} />
          <div>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>LLM suggests: </span>
            <span style={{ color: cfg.badgeColor, fontSize: "12px" }}>{cfg.suggestion}</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={msg.classification === "positive" ? onBookMeeting : undefined}
            style={{ background: cfg.primaryBg, border: `1px solid ${cfg.border}60`, borderRadius: "8px", color: cfg.primaryColor, fontSize: "13px", fontWeight: 500, padding: "8px 16px", cursor: "pointer", fontFamily: "Inter, sans-serif", flex: 1 }}
          >
            {cfg.primaryBtn}
          </button>
          <button style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", color: "rgba(255,255,255,0.6)", fontSize: "13px", fontWeight: 500, padding: "8px 14px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
            {msg.classification === "positive" ? "Send Custom Reply" : msg.classification === "neutral" ? "Reply Manually" : "Override & Reply"}
          </button>
        </div>
      </div>
      <p style={{ color: "rgba(255,255,255,0.22)", fontSize: "11px", marginTop: "5px" }}>{msg.timestamp}</p>
    </div>
  );
}

function EmptyState({ onQuickAction }: { onQuickAction: (text: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "40px 24px" }}>
      <div style={{ width: "110px", height: "110px", borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, rgba(240,124,45,0.55), rgba(240,124,45,0.08) 60%, transparent)", boxShadow: "0 0 60px rgba(124,92,252,0.18), inset 0 0 40px rgba(240,124,45,0.08)", marginBottom: "28px", animation: "pulse-orb 3s ease-in-out infinite" }} />
      <h3 style={{ color: "#F0F1F5", fontSize: "20px", fontWeight: 500, marginBottom: "8px", textAlign: "center" }}>Start a conversation</h3>
      <p style={{ color: "rgba(255,255,255,0.38)", fontSize: "14px", textAlign: "center", lineHeight: 1.65, maxWidth: "320px", marginBottom: "32px" }}>
        Fill in the lead details on the left, then type your message or use a quick action below.
      </p>
      {/* <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
        {["Research this lead", "Generate outreach email", "Find leads in Fintech"].map(s => (
          <button key={s} onClick={() => onQuickAction(s)}
            style={{ background: "#0D1128", border: "1px solid rgba(124,92,252,0.25)", borderRadius: "20px", color: "rgba(255,255,255,0.6)", fontSize: "13px", padding: "8px 16px", cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 0.18s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(124,92,252,0.1)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,92,252,0.5)"; (e.currentTarget as HTMLElement).style.color = "#F0F1F5"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#0D1128"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,92,252,0.25)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"; }}
          >
            {s}
          </button>
        ))}
      </div> */}
    </div>
  );
}
function LeadHistoryView({ msg }: { msg: Extract<MessageType, { kind: "lead-history" }> }) {
  const [tab, setTab] = useState<"emails" | "meetings" | "replies">("emails");
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem("user_id") || "";

  useEffect(() => {
    fetch(`http://localhost:8080/api/history/${msg.lead.id}?user_id=${userId}`)
      .then(r => r.json())
      .then(data => { setHistory(data || []); setLoading(false); })
      .catch(() => { setHistory([]); setLoading(false); });
  }, [msg.lead.id]);

  const filtered = history.filter(item => {
    if (tab === "emails") return item.type === "email" && item.direction === "outbound";
    if (tab === "meetings") return item.type === "meeting";
    if (tab === "replies") return item.type === "reply" || (item.type === "email" && item.direction === "inbound");
    return false;
  });

  const tabs = [
    { key: "emails" as const, label: "Emails" },
    { key: "meetings" as const, label: "Meetings" },
    { key: "replies" as const, label: "Replies" },
  ];

  return (
    <div style={{ marginBottom: "16px", maxWidth: "92%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
        <div style={{ width: "22px", height: "22px", borderRadius: "6px", background: "rgba(240,124,45,0.1)", border: "1px solid rgba(240,124,45,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Mail size={11} color="#F07C2D" />
        </div>
        <span style={{ color: "#F07C2D", fontSize: "11px", fontWeight: 600 }}>Past Interactions</span>
        <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "10px" }}>· {msg.lead.name}</span>
      </div>
      <div style={{ background: "#0D1128", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", overflow: "hidden" }}>
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ flex: 1, padding: "10px", background: "none", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 500, fontFamily: "Inter, sans-serif", color: tab === t.key ? "#F07C2D" : "rgba(255,255,255,0.4)", borderBottom: tab === t.key ? "2px solid #F07C2D" : "2px solid transparent" }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ padding: "12px 16px", maxHeight: "300px", overflowY: "auto" }}>
          {loading ? (
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", textAlign: "center", padding: "20px 0" }}>Loading...</p>
          ) : filtered.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", textAlign: "center", padding: "20px 0" }}>No {tab} found.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {filtered.map(item => (
                <div key={item.id} style={{ background: "#111530", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", padding: "10px 12px" }}>
                  <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px", marginBottom: "4px" }}>
                    {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  {item.subject && <p style={{ color: "#F0F1F5", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>{item.subject}</p>}
                  {item.body && (
                      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", lineHeight: 1.7, whiteSpace: "pre-wrap", marginTop: "6px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "6px" }}>
                          {item.body}
                      </p>
                  )}
                  {item.reply_text && (
                      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", lineHeight: 1.7, whiteSpace: "pre-wrap", marginTop: "6px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "6px" }}>
                          {item.reply_text}
                      </p>
                  )}
                  {item.reply_classification && (
                      <span style={{
                          fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "4px",
                          background: item.reply_classification === "POSITIVE" ? "rgba(34,197,94,0.12)" :
                                      item.reply_classification === "NEUTRAL" ? "rgba(245,158,11,0.12)" :
                                      item.reply_classification === "MEETING_DETAILS" ? "rgba(240,124,45,0.12)" :
                                      "rgba(239,68,68,0.12)",
                          color: item.reply_classification === "POSITIVE" ? "#22C55E" :
                                item.reply_classification === "NEUTRAL" ? "#F59E0B" :
                                item.reply_classification === "MEETING_DETAILS" ? "#F07C2D" :
                                "#EF4444",
                          textTransform: "uppercase" as const,
                          marginTop: "6px",
                          display: "inline-block"
                      }}>
                          {item.reply_classification}
                      </span>
                  )}
                  {item.event_link && <a href={item.event_link} target="_blank" rel="noopener noreferrer" style={{ color: "#F07C2D", fontSize: "12px", marginTop: "4px", display: "block" }}>Join Meeting →</a>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <p style={{ color: "rgba(255,255,255,0.22)", fontSize: "11px", marginTop: "5px" }}>{msg.timestamp}</p>
    </div>
  );
}

function AnalyticsCard({ msg }: { msg: Extract<MessageType, { kind: "analytics" }> }) {
  const [filter, setFilter] = useState<"7d" | "30d" | "quarter" | "all">("30d");

  const DATA = {
    "7d":      { contacted: 12, replied: 4,  meetings: 1, total: 18 },
    "30d":     { contacted: 47, replied: 18, meetings: 5, total: 63 },
    "quarter": { contacted: 134, replied: 52, meetings: 14, total: 198 },
    "all":     { contacted: 312, replied: 98, meetings: 31, total: 445 },
  };

  const d = DATA[filter];
  const replyRate = Math.round((d.replied / d.contacted) * 100);
  const meetingRate = Math.round((d.meetings / d.replied) * 100);
  const conversionRate = Math.round((d.meetings / d.total) * 100);

  const barData = [
    { name: "Contacted", value: d.contacted, fill: "#F07C2D" },
    { name: "Replied",   value: d.replied,   fill: "#22C55E" },
    { name: "Meetings",  value: d.meetings,  fill: "#60A5FA" },
  ];

  const pieData = [
    { name: "New",       value: d.total - d.contacted,        color: "rgba(255,255,255,0.35)" },
    { name: "Contacted", value: d.contacted - d.replied,      color: "#F07C2D" },
    { name: "Replied",   value: d.replied - d.meetings,       color: "#22C55E" },
    { name: "Meetings",  value: d.meetings,                   color: "#60A5FA" },
  ];

  const filters: { key: "7d"|"30d"|"quarter"|"all"; label: string }[] = [
    { key: "7d",      label: "7 Days" },
    { key: "30d",     label: "This Month" },
    { key: "quarter", label: "Quarter" },
    { key: "all",     label: "All Time" },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div style={{ background: "#1E2230", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "8px 12px" }}>
          <p style={{ color: "#F0F1F5", fontSize: "13px", fontWeight: 600, margin: 0 }}>{payload[0].name}</p>
          <p style={{ color: payload[0].fill || "#F07C2D", fontSize: "13px", margin: "2px 0 0", fontWeight: 700 }}>{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ marginBottom: "16px", maxWidth: "95%" }}>
      {/* Agent badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
        <div style={{ width: "22px", height: "22px", borderRadius: "6px", background: "rgba(240,124,45,0.1)", border: "1px solid rgba(240,124,45,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>📊</div>
        <span style={{ color: "#F07C2D", fontSize: "11px", fontWeight: 600 }}>Analytics</span>
        <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "10px" }}>· Outreach performance</span>
      </div>

      <div style={{ background: "#0D1128", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", overflow: "hidden" }}>

        {/* Header + Filters */}
        <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: "#F0F1F5", fontSize: "14px", fontWeight: 500 }}>Outreach Performance</span>
          <div style={{ display: "flex", gap: "4px" }}>
            {filters.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                style={{ padding: "4px 10px", borderRadius: "6px", border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 500, background: filter === f.key ? "#F07C2D" : "rgba(255,255,255,0.06)", color: filter === f.key ? "#fff" : "rgba(255,255,255,0.4)", transition: "all 0.15s" }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", background: "rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {[
            { label: "Total Leads", value: d.total,     color: "#F0F1F5", sub: "in pipeline" },
            { label: "Contacted",   value: d.contacted, color: "#F07C2D", sub: "emails sent" },
            { label: "Replied",     value: d.replied,   color: "#22C55E", sub: `${replyRate}% reply rate` },
            { label: "Meetings",    value: d.meetings,  color: "#60A5FA", sub: `${meetingRate}% from replies` },
          ].map(k => (
            <div key={k.label} style={{ background: "#0D1128", padding: "16px 14px" }}>
              <p style={{ color: k.color, fontSize: "22px", fontWeight: 700, margin: 0 }}>{k.value}</p>
              <p style={{ color: "#F0F1F5", fontSize: "12px", fontWeight: 500, margin: "2px 0" }}>{k.label}</p>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px", margin: 0 }}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Charts Row — Bar + Donut side by side */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>

          {/* Bar Chart */}
          <div style={{ padding: "20px 16px", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "16px" }}>Funnel Breakdown</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={barData} barSize={28} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                  {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Donut Chart */}
          <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column" }}>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "16px" }}>Status Distribution</p>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      const p = payload[0];
                      return (
                        <div style={{ background: "#1E2230", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "8px 12px" }}>
                          <p style={{ color: "#F0F1F5", fontSize: "12px", margin: 0 }}>{p.name}</p>
                          <p style={{ color: (p.payload as any).color, fontSize: "13px", fontWeight: 700, margin: "2px 0 0" }}>{p.value}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px", justifyContent: "center" }}>
              {pieData.map(d => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px" }}>{d.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Conversion Rate strip */}
        <div style={{ margin: "16px", background: "#111530", borderRadius: "10px", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", margin: "0 0 4px" }}>Overall Conversion Rate</p>
            <p style={{ color: "#F0F1F5", fontSize: "13px", margin: 0 }}>Leads → Meetings booked</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ color: conversionRate >= 5 ? "#22C55E" : "#F07C2D", fontSize: "28px", fontWeight: 700, margin: 0 }}>{conversionRate}%</p>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px", margin: 0 }}>Industry avg: 3–7%</p>
          </div>
        </div>

      </div>
      <p style={{ color: "rgba(255,255,255,0.22)", fontSize: "11px", marginTop: "5px" }}>{msg.timestamp}</p>
    </div>
  );
}

export function ChatPanel({
  messages, isTyping, typingStage, followUpChips,
  onSend, onChipClick, onConfirmMeeting, onSendEmailFromCard, onRefineMessage,
  onGenerateBulkEmails, onBulkApprove, onApproveFollowup, onSkipFollowup,
  onViewLeadProfile, onViewLeadHistory, onBookMeetingFromReply,
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSend(inputValue.trim());
    setInputValue("");
    if (textAreaRef.current) textAreaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px";
  };

  const handleChipClick = (text: string) => {
    setInputValue(text);
    textAreaRef.current?.focus();
    onChipClick(text);
  };

  const isEmpty = messages.length === 0 && !isTyping;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#080B18", overflow: "hidden", fontFamily: "Inter, sans-serif", minWidth: 0 }}>
      {/* Messages area */}
      <div style={{ flex: 1, overflowY: "auto", padding: isEmpty ? "0" : "24px 28px", scrollBehavior: "smooth" }}>
        {isEmpty ? (
          <EmptyState onQuickAction={onSend} />
        ) : (
          <>
            {messages.map(msg => {
              if (msg.kind === "user") return <UserBubble key={msg.id} msg={msg} />;
              if (msg.kind === "agent") return <AgentBubble key={msg.id} msg={msg} />;
              if (msg.kind === "email-draft") return <EmailDraftCard key={msg.id} msg={msg} onSend={onSendEmailFromCard} onRefine={() => onRefineMessage(msg.id)} />;
              if (msg.kind === "meeting") return <MeetingCard key={msg.id} msg={msg} onConfirm={() => onConfirmMeeting(msg.id)} />;
              if (msg.kind === "email-sent") return <EmailSentBanner key={msg.id} msg={msg} />;
              if (msg.kind === "system") return <SystemMessage key={msg.id} msg={msg} />;
              if (msg.kind === "lead-list") return <LeadListCard key={msg.id} msg={msg} onGenerateBulkEmails={onGenerateBulkEmails} onViewProfile={onViewLeadProfile} onViewLeadHistory={onViewLeadHistory} />;
              if (msg.kind === "bulk-approval") return <BulkApprovalCard key={msg.id} msg={msg} onApprove={() => onBulkApprove(msg.id)} onDecline={() => {}} />;
              if (msg.kind === "followup-pending") return <FollowupPendingCard key={msg.id} msg={msg} onApprove={() => onApproveFollowup(msg.id)} onSkip={() => onSkipFollowup(msg.id)} />;
              if (msg.kind === "analytics") return <AnalyticsCard key={msg.id} msg={msg} />;
              if (msg.kind === "lead-history") return <LeadHistoryView key={msg.id} msg={msg} />;
              if (msg.kind === "reply-received") return <ReplyReceivedCard key={msg.id} msg={msg} onBookMeeting={() => onBookMeetingFromReply(msg.leadName)} />;
              return null;
            })}
            {isTyping && <TypingIndicator stage={typingStage} />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Quick Actions bar
      {!isEmpty && (
        <div style={{ padding: "8px 28px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: "6px", alignItems: "center", overflowX: "auto" }}>
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "11px", flexShrink: 0 }}>Quick:</span>
          {QUICK_ACTIONS.map(action => (
            <button key={action.label} onClick={() => handleChipClick(action.prompt)}
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", color: "rgba(255,255,255,0.45)", fontSize: "11px", padding: "4px 10px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, fontFamily: "inherit", transition: "all 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,92,252,0.4)"; (e.currentTarget as HTMLElement).style.color = "#F07C2D"; (e.currentTarget as HTMLElement).style.background = "rgba(124,92,252,0.06)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              {action.label}
            </button>
          ))}
          {followUpChips.slice(0, 2).map((chip, i) => (
            <button key={i} onClick={() => handleChipClick(chip)}
              style={{ background: "transparent", border: "1px solid rgba(124,92,252,0.3)", borderRadius: "20px", color: "#F07C2D", fontSize: "11px", padding: "4px 10px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, fontFamily: "inherit", transition: "all 0.15s" }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(124,92,252,0.1)")}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}
            >
              {chip}
            </button>
          ))}
        </div>
      )} */}

      {/* Input area */}
      <div style={{ background: "#0D1128", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "16px 20px", flexShrink: 0 }}>
        <div style={{ background: "#1E2230", border: inputFocused ? "1px solid rgba(240,124,45,0.55)" : "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", boxShadow: inputFocused ? "0 0 0 2px rgba(240,124,45,0.12)" : "none", transition: "all 0.2s ease", padding: "12px 14px", marginBottom: "10px" }}>
          <textarea
            ref={textAreaRef}
            value={inputValue}
            onChange={handleTextAreaChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder="Ask the agent to research, write an email, book a meeting..."
            rows={1}
            style={{ background: "transparent", border: "none", outline: "none", color: "#F0F1F5", fontSize: "14px", width: "100%", resize: "none", fontFamily: "inherit", lineHeight: 1.6, maxHeight: "96px", overflowY: "auto" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            style={{ background: "#F07C2D", border: "none", borderRadius: "8px", color: "#fff", fontSize: "14px", fontWeight: 500, height: "36px", padding: "0 16px", cursor: inputValue.trim() ? "pointer" : "not-allowed", opacity: inputValue.trim() ? 1 : 0.4, display: "flex", alignItems: "center", gap: "6px", fontFamily: "inherit", transition: "all 0.2s ease" }}
            onMouseEnter={e => { if (inputValue.trim()) (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(240,124,45,0.4)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
          >
            <Send size={14} /> Send
          </button>
        </div>
      </div>

      <style>{`
  @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); opacity: 0.6; } 40% { transform: translateY(-6px); opacity: 1; } }
  @keyframes fadeInOut { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.9; } }
  @keyframes pulse-orb { 0%, 100% { transform: scale(1); opacity: 0.9; } 50% { transform: scale(1.05); opacity: 1; } }
  @keyframes slideInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

  * {
    scrollbar-width: thin;
    scrollbar-color: rgba(240,124,45,0.3) transparent;
  }
  *::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }
  *::-webkit-scrollbar-track {
    background: transparent;
  }
  *::-webkit-scrollbar-thumb {
    background: rgba(240,124,45,0.3);
    border-radius: 99px;
  }
  *::-webkit-scrollbar-thumb:hover {
    background: rgba(240,124,45,0.6);
  }
`}</style>
    </div>
  );
}
