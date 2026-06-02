import { useState, useEffect } from "react";
import { Search, PenLine, CalendarDays, Clock, Send, Mail, Calendar, CheckCircle2, ChevronRight, Video, Check, Brain, Loader2, Phone, Linkedin, Building2 } from "lucide-react";
interface EmailDraft {
  subject: string;
  body: string;
  rationale: string;
  flag: 0 | 1 | 2;
}

export interface HistoryItem {
  id: string;
  type: "email" | "meeting" | "reply";
  date: string;
  subject?: string;
  status?: "sent" | "failed";
  title?: string;
  duration?: string;
  meetLink?: string;
  meetingStatus?: "upcoming" | "completed" | "cancelled";
  classification?: "positive" | "neutral" | "negative";
  replyPreview?: string;
  children?: HistoryItem[];
}

export interface PanelLead {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone?: string;
  linkedin?: string;
  status: "new" | "contacted" | "replied" | "cold";
  techStack?: string[];
  companySummary?: string;
}

interface Campaign {
  name: string;
  totalLeads: number;
  contacted: number;
  replied: number;
  meetings: number;
  status: "active" | "paused";
  completedSteps: number;
}

interface ActionHistoryPanelProps {
  emailDraft: EmailDraft | null;
  pendingApproval: boolean;
  leadEmail: string;
  onSendEmail: () => void;
  onBookMeeting: () => void;
  onApprove: () => void;
  onDecline: () => void;
  onQuickAction: (action: string) => void;
  history: HistoryItem[];
  leads?: PanelLead[];
}

const FLAG_LABELS: Record<0 | 1 | 2, { label: string; color: string; bg: string }> = {
  0: { label: "Drafting", color: "rgba(255,255,255,0.5)", bg: "rgba(255,255,255,0.08)" },
  1: { label: "Ready to Send", color: "#F07C2D", bg: "rgba(124,92,252,0.15)" },
  2: { label: "Sent", color: "#22C55E", bg: "rgba(34,197,94,0.12)" },
};


const TECH_COLORS: Record<string, { color: string; bg: string }> = {
  React: { color: "#61DAFB", bg: "rgba(97,218,251,0.1)" },
  Salesforce: { color: "#00A1E0", bg: "rgba(0,161,224,0.1)" },
  HubSpot: { color: "#FF7A59", bg: "rgba(255,122,89,0.1)" },
  Stripe: { color: "#635BFF", bg: "rgba(99,91,255,0.1)" },
  AWS: { color: "#FF9900", bg: "rgba(255,153,0,0.1)" },
  Snowflake: { color: "#29B5E8", bg: "rgba(41,181,232,0.1)" },
  Segment: { color: "#52BD94", bg: "rgba(82,189,148,0.1)" },
  dbt: { color: "#FF694B", bg: "rgba(255,105,75,0.1)" },
};
const LEAD_STATUS_CONFIG = {
  new: { label: "New", color: "rgba(255,255,255,0.5)", bg: "rgba(255,255,255,0.08)" },
  contacted: { label: "Contacted", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  replied: { label: "Replied", color: "#22C55E", bg: "rgba(34,197,94,0.12)" },
  cold: { label: "Cold", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
};
//leads tab
function LeadsTab({ leads }: { leads: PanelLead[] }) {
  const [selectedLead, setSelectedLead] = useState<PanelLead | null>(null);

  if (leads.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0", gap: "10px" }}>
        <Search size={24} color="rgba(255,255,255,0.15)" />
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", textAlign: "center", lineHeight: 1.6 }}>
          No leads yet. Use "Find Leads" in chat to discover leads.
        </p>
      </div>
    );
  }

  if (selectedLead) {
    const status = LEAD_STATUS_CONFIG[selectedLead.status];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Back button */}
        <button
          onClick={() => setSelectedLead(null)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#F07C2D", fontSize: "12px", fontFamily: "Inter, sans-serif", padding: 0, textAlign: "left", display: "flex", alignItems: "center", gap: "4px" }}
        >
          ← Back to leads
        </button>

        {/* Lead header */}
        <div style={{ background: "#0D1128", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "14px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "4px" }}>
            <div>
              <p style={{ color: "#F0F1F5", fontSize: "15px", fontWeight: 600, margin: 0 }}>{selectedLead.name}</p>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px", margin: "2px 0 0" }}>{selectedLead.title} · {selectedLead.company}</p>
            </div>
            <span style={{ background: status.bg, color: status.color, fontSize: "10px", fontWeight: 500, padding: "3px 8px", borderRadius: "20px" }}>{status.label}</span>
          </div>
        </div>

        {/* Contact info */}
        <div style={{ background: "#0D1128", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", overflow: "hidden" }}>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", padding: "10px 14px 6px", margin: 0 }}>Contact Info</p>
          {[
            { icon: Mail, value: selectedLead.email },
            ...(selectedLead.phone ? [{ icon: Phone, value: selectedLead.phone }] : []),
            ...(selectedLead.linkedin ? [{ icon: Linkedin, value: selectedLead.linkedin }] : []),
            { icon: Building2, value: selectedLead.company },
          ].map((item, i, arr) => {
            const Icon = item.icon;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 14px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <Icon size={13} color="rgba(255,255,255,0.3)" />
                <span style={{ color: "#F07C2D", fontSize: "12px", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.value}</span>
              </div>
            );
          })}
        </div>

        {/* Company intelligence */}
        {(selectedLead.companySummary || selectedLead.techStack) && (
          <div style={{ background: "#0D1128", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "12px 14px" }}>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Company Intelligence</p>
            {selectedLead.companySummary && (
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "12px", lineHeight: 1.65, marginBottom: "10px" }}>{selectedLead.companySummary}</p>
            )}
            {selectedLead.techStack && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                {selectedLead.techStack.map(tech => {
                  const colors = TECH_COLORS[tech] || { color: "rgba(255,255,255,0.5)", bg: "rgba(255,255,255,0.06)" };
                  return (
                    <span key={tech} style={{ background: colors.bg, color: colors.color, fontSize: "11px", padding: "2px 8px", borderRadius: "6px", fontWeight: 500 }}>{tech}</span>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", marginBottom: "4px" }}>{leads.length} leads found</p>
      {leads.map((lead, i) => {
        const status = LEAD_STATUS_CONFIG[lead.status];
        const initials = lead.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
        const avatarColors = [
          { bg: "rgba(124,92,252,0.2)", color: "#F07C2D" },
          { bg: "rgba(34,197,94,0.15)", color: "#34D399" },
          { bg: "rgba(245,158,11,0.15)", color: "#F59E0B" },
        ][i % 3];
        return (
          <button
            key={lead.id}
            onClick={() => setSelectedLead(lead)}
            style={{ background: "#0D1128", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "10px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", textAlign: "left", fontFamily: "Inter, sans-serif", width: "100%", transition: "all 0.15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#111530"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,124,45,0.3)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#0D1128"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; }}
          >
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: avatarColors.bg, color: avatarColors.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: "#F0F1F5", fontSize: "13px", fontWeight: 500, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.name}</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", margin: "1px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.title} · {lead.company}</p>
            </div>
            <span style={{ background: status.bg, color: status.color, fontSize: "10px", fontWeight: 500, padding: "2px 7px", borderRadius: "20px", flexShrink: 0 }}>{status.label}</span>
            <ChevronRight size={13} color="rgba(255,255,255,0.25)" />
          </button>
        );
      })}
    </div>
  );
}

// ─── Campaigns Tab ─────────────────────────────────────────────────────────────
function CampaignsTab() {
  const [followupDays, setFollowupDays] = useState([3, 7, 14]);
  const [showLlmSuggestion, setShowLlmSuggestion] = useState(false);
  const [llmLoading, setLlmLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [llmRationale, setLlmRationale] = useState("Recommended cadence for Fintech B2B.");
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = localStorage.getItem("user_id") || "user-001";

    const loadCampaign = (isFirstLoad = false) => {
      fetch(`http://localhost:8080/api/campaigns/${uid}`)
        .then(r => r.json())
        .then((data: any[]) => {
          const active = data.find(c => c.status === "active") || data[0];
          if (active) {
            setCampaign({
              name: active.name,
              totalLeads: active.lead_count,
              contacted: active.emails_sent,
              replied: active.replies_received,
              meetings: active.meetings_booked,
              status: active.status,
              completedSteps: active.completed_steps
            });
            setActiveCampaignId(active.campaign_id);
            if (isFirstLoad) {
              fetch(`http://localhost:8080/api/followup/config/${active.campaign_id}`)
                .then(r => r.json())
                .then(cfg => {
                  if (cfg && cfg.followup_1_days) {
                    setFollowupDays([
                      cfg.followup_1_days,
                      cfg.followup_2_days,
                      cfg.followup_3_days
                    ]);
                  }
                })
                .catch(() => {});
            }
          }
          if (isFirstLoad) setLoading(false);
        })
        .catch(() => { if (isFirstLoad) setLoading(false); });
    };

    loadCampaign(true);
    const interval = setInterval(() => loadCampaign(false), 10000);
    return () => clearInterval(interval);
  }, []);
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0" }}>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>Loading campaigns...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0" }}>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>No campaigns yet.</p>
      </div>
    );
  }

  const handleAskLlm = async () => {
    setLlmLoading(true);
    try {
      const uid = localStorage.getItem("user_id") || "user-001";
      const profileRes = await fetch(`http://localhost:8080/api/profile/${uid}`);
      const profile = await profileRes.json().catch(() => ({}));
      const industry = profile?.target_industry || "SaaS";

      const res = await fetch("http://localhost:8080/api/followup/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              user_id: uid,
              industry: industry
          })
      });
      const data = await res.json();
      setFollowupDays([
        data.followup_1_days,
        data.followup_2_days,
        data.followup_3_days
      ]);
      setLlmRationale(data.rationale || "Recommended based on industry data.");
    } catch {
      setLlmRationale("Recommended cadence for Fintech B2B.");
    }
    setLlmLoading(false);
    setShowLlmSuggestion(true);
  };

  const handleAcceptLlm = () => {
    setFollowupDays([3, 5, 10]);
    setShowLlmSuggestion(false);
  };

  const handleSave = async () => {
    const uid = localStorage.getItem("user_id") || "user-001";
    try {
      await fetch("http://localhost:8080/api/followup/config/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            user_id: uid,
            campaign_id: activeCampaignId || "default",
            config_id: activeCampaignId || "default",
            followup_1_days: followupDays[0],
            followup_2_days: followupDays[1],
            followup_3_days: followupDays[2],
            max_followups: 3,
            llm_recommended: false
        })
      });
    } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const timelineDots = [
    { day: 0, label: "Initial", completed: true },
    { day: followupDays[0], label: "Follow-up 1", completed: campaign.completedSteps >= 1 },
    { day: followupDays[1], label: "Follow-up 2", completed: campaign.completedSteps >= 2 },
    { day: followupDays[2], label: "Final", completed: campaign.completedSteps >= 3 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Campaign Card */}
      <div style={{ background: "#0D1128", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <p style={{ color: "#F0F1F5", fontSize: "14px", fontWeight: 500 }}>{campaign.name}</p>
          <span style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E", fontSize: "11px", fontWeight: 500, padding: "3px 10px", borderRadius: "20px" }}>Active</span>
        </div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {[
            { label: "Leads", value: campaign.totalLeads, color: "rgba(255,255,255,0.6)" },
            { label: "Contacted", value: campaign.contacted, color: "#F07C2D" },
            { label: "Replied", value: campaign.replied, color: "#22C55E" },
            { label: "Meetings", value: campaign.meetings, color: "#34D399" },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <p style={{ color: stat.color, fontSize: "16px", fontWeight: 600, margin: 0 }}>{stat.value}</p>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px", margin: "1px 0 0" }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Follow-up Timeline */}
      <div style={{ background: "#0D1128", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "14px" }}>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Follow-up Sequence</p>

        {/* Horizontal Timeline */}
        <div style={{ position: "relative", padding: "8px 8px 4px" }}>
          {/* Connecting lines */}
          <div style={{ position: "absolute", top: "36px", left: "24px", right: "24px", height: "2px", display: "flex" }}>
            {timelineDots.slice(0, -1).map((dot, i) => (
              <div key={i} style={{ flex: 1, height: "2px", background: dot.completed && timelineDots[i + 1].completed ? "#F07C2D" : "none", borderTop: dot.completed && timelineDots[i + 1].completed ? "none" : "2px dashed rgba(240,124,45,0.3)" }} />
            ))}
          </div>

          {/* Dots */}
          <div style={{ display: "flex", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
            {timelineDots.map((dot) => (
              <div key={dot.day} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px", marginBottom: "4px" }}>Day {dot.day}</p>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  background: dot.completed ? "#F07C2D" : "transparent",
                  border: `2px solid ${dot.completed ? "#F07C2D" : "rgba(124,92,252,0.5)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.3s ease",
                }}>
                  {dot.completed ? (
                    <Check size={14} color="#fff" />
                  ) : (
                    <span style={{ color: "#F07C2D", fontSize: "10px", fontWeight: 600 }}>{dot.day}</span>
                  )}
                </div>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", textAlign: "center", marginTop: "4px" }}>{dot.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Editable Day Inputs */}
        <div style={{ marginTop: "6px", paddingTop: "6px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", marginBottom: "8px" }}>Days after initial:</p>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {followupDays.map((days, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px" }}>FU#{i + 1}</span>
                <input
                  type="number"
                  value={days}
                  min={1}
                  max={30}
                  onChange={e => {
                    const newDays = [...followupDays];
                    newDays[i] = Number(e.target.value);
                    setFollowupDays(newDays);
                  }}
                  style={{ width: "44px", background: "#111530", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#F0F1F5", fontSize: "13px", fontWeight: 500, padding: "5px 8px", textAlign: "center", outline: "none", fontFamily: "Inter, sans-serif" }}
                />
                <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "10px" }}>days</span>
              </div>
            ))}
          </div>
        </div>

        {/* LLM Suggestion */}
        <button
          onClick={handleAskLlm}
          disabled={llmLoading}
          style={{ marginTop: "6px", width: "100%", background: "transparent", border: "1px solid rgba(240,124,45,0.3)", borderRadius: "8px", color: "#F07C2D", fontSize: "12px", fontWeight: 500, padding: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontFamily: "Inter, sans-serif" }}
        >
          {llmLoading ? <><Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} /> Asking LLM...</> : <><Brain size={13} /> 🤖 Ask LLM to recommend intervals</>}
        </button>

        {showLlmSuggestion && (
          <div style={{ marginTop: "10px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "8px", padding: "10px 12px" }}>
            <p style={{ color: "#F59E0B", fontSize: "12px", marginBottom: "8px" }}>
              💡 {llmRationale}
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={handleAcceptLlm} style={{ background: "#F59E0B", border: "none", borderRadius: "6px", color: "#000", fontSize: "12px", fontWeight: 500, padding: "5px 12px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Accept</button>
              <button onClick={() => setShowLlmSuggestion(false)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "6px", color: "rgba(255,255,255,0.5)", fontSize: "12px", padding: "5px 12px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Keep Custom</button>
            </div>
          </div>
        )}

        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "11px", fontStyle: "italic", marginTop: "4px" }}>
          Default: 3 / 7 / 14 days. Industry standard for B2B outreach.
        </p>

        <button
          onClick={handleSave}
          style={{ marginTop: "4px", width: "100%", background: saved ? "#22C55E" : "#F07C2D", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 500, padding: "9px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontFamily: "Inter, sans-serif", transition: "background 0.2s, box-shadow 0.2s" }}
          onMouseEnter={e => { if (!saved) (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(240,124,45,0.3)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
        >
          {saved ? <><Check size={14} /> Saved!</> : "Save Configuration"}
        </button>
      </div>
    </div>
  );
}

// ─── Enhanced History Tab ──────────────────────────────────────────────────────
type HistoryFilter = "all" | "emails" | "meetings" | "replies";

function EnhancedHistoryTimeline({ history }: { history: HistoryItem[] }) {
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedChildren, setExpandedChildren] = useState<Set<string>>(new Set());

  const filtered = history.filter(item => {
    if (filter === "all") return true;
    if (filter === "emails") return item.type === "email";
    if (filter === "meetings") return item.type === "meeting";
    if (filter === "replies") return item.type === "reply";
    return true;
  });

  const filterStyle = (f: HistoryFilter) => ({
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px 2px",
    fontSize: "12px",
    fontWeight: filter === f ? 500 : 400,
    color: filter === f ? "#F0F1F5" : "rgba(255,255,255,0.35)",
    borderBottom: filter === f ? "2px solid #F07C2D" : "2px solid transparent",
    transition: "all 0.15s",
    fontFamily: "Inter, sans-serif",
  });

  const getDotColor = (item: HistoryItem) => {
    if (item.type === "reply") {
      return item.classification === "positive" ? "#22C55E" : item.classification === "neutral" ? "#F59E0B" : "#EF4444";
    }
    if (item.type === "meeting") return "#F07C2D";
    return item.status === "sent" ? "#22C55E" : "#EF4444";
  };

  if (filtered.length === 0) {
    return (
      <div>
        <div style={{ display: "flex", gap: "12px", marginBottom: "14px" }}>
          {(["all", "emails", "meetings", "replies"] as HistoryFilter[]).map(f => (
            <button key={f} style={filterStyle(f)} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 0", gap: "10px" }}>
          <div style={{ display: "flex", gap: "12px" }}>
            <Mail size={24} color="rgba(255,255,255,0.15)" />
            <Calendar size={24} color="rgba(255,255,255,0.15)" />
          </div>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", textAlign: "center", lineHeight: 1.6 }}>
            No interactions yet. Start by sending an outreach email.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Filter pills */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "14px", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "6px" }}>
        {(["all", "emails", "meetings", "replies"] as HistoryFilter[]).map(f => (
          <button key={f} style={filterStyle(f)} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div style={{ position: "relative", paddingLeft: "20px" }}>
        <div style={{ position: "absolute", left: "7px", top: "8px", bottom: "8px", width: "1px", background: "rgba(255,255,255,0.08)" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map(item => {
            const isExpanded = expanded === item.id;
            const dotColor = getDotColor(item);

            return (
              <div key={item.id} style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "-15px", top: "10px", width: "8px", height: "8px", borderRadius: "50%", background: dotColor, boxShadow: `0 0 6px ${dotColor}80` }} />

                <button
                  style={{ background: item.type === "reply" ? (item.classification === "positive" ? "rgba(34,197,94,0.05)" : item.classification === "neutral" ? "rgba(245,158,11,0.05)" : "rgba(239,68,68,0.05)") : "#111530", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 12px", width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "background 0.15s" }}
                  onClick={() => setExpanded(isExpanded ? null : item.id)}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#161B30")}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = item.type === "reply" ? (item.classification === "positive" ? "rgba(34,197,94,0.05)" : item.classification === "neutral" ? "rgba(245,158,11,0.05)" : "rgba(239,68,68,0.05)") : "#111530")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", flex: 1 }}>
                      {/* Type badge */}
                      <span style={{ background: item.type === "reply" ? "rgba(240,124,45,0.1)" : item.type === "meeting" ? "rgba(240,124,45,0.12)" : "rgba(255,255,255,0.07)", color: item.type === "reply" ? "#F07C2D" : item.type === "meeting" ? "#F07C2D" : "rgba(255,255,255,0.5)", fontSize: "10px", fontWeight: 500, padding: "1px 6px", borderRadius: "20px" }}>
                        {item.type === "reply" ? "Reply" : item.type === "meeting" ? "Meeting" : "Email"}
                      </span>
                      {item.type === "email" && item.status && (
                        <span style={{ background: item.status === "sent" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", color: item.status === "sent" ? "#22C55E" : "#EF4444", fontSize: "10px", fontWeight: 500, padding: "1px 6px", borderRadius: "20px" }}>
                          {item.status === "sent" ? "Sent" : "Failed"}
                        </span>
                      )}
                      {item.type === "reply" && item.classification && (
                        <span style={{ background: item.classification === "positive" ? "rgba(34,197,94,0.12)" : item.classification === "neutral" ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)", color: item.classification === "positive" ? "#22C55E" : item.classification === "neutral" ? "#F59E0B" : "#EF4444", fontSize: "9px", fontWeight: 700, padding: "1px 6px", borderRadius: "4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          {item.classification}
                        </span>
                      )}
                      {item.type === "meeting" && item.meetingStatus && (
                        <span style={{ background: item.meetingStatus === "completed" ? "rgba(34,197,94,0.12)" : item.meetingStatus === "upcoming" ? "rgba(240,124,45,0.12)" : "rgba(239,68,68,0.12)", color: item.meetingStatus === "completed" ? "#22C55E" : item.meetingStatus === "upcoming" ? "#F07C2D" : "#EF4444", fontSize: "10px", fontWeight: 500, padding: "1px 6px", borderRadius: "20px" }}>
                          {item.meetingStatus.charAt(0).toUpperCase() + item.meetingStatus.slice(1)}
                        </span>
                      )}
                    </div>
                    <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "10px", flexShrink: 0 }}>{item.date}</span>
                    <ChevronRight size={12} color="rgba(255,255,255,0.25)" style={{ transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
                  </div>

                  <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.subject || item.title || item.replyPreview || ""}
                  </p>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      {item.type === "email" && (
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>
                          {item.status === "sent" ? "Email delivered successfully." : "Delivery failed. Check recipient address."}
                        </p>
                      )}
                      {item.type === "meeting" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          {item.duration && <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>Duration: {item.duration}</span>}
                          {item.meetLink && (
                            <a href="#" style={{ color: "#F07C2D", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                              <Video size={11} /> {item.meetLink}
                            </a>
                          )}
                        </div>
                      )}
                      {item.type === "reply" && item.replyPreview && (
                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", lineHeight: 1.6 }}>{item.replyPreview}</p>
                      )}
                    </div>
                  )}

                  {/* Thread children */}
                  {item.children && item.children.length > 0 && (
                    <div style={{ marginTop: "8px", paddingLeft: "12px", borderLeft: "2px solid rgba(255,255,255,0.06)" }}>
                      {item.children.map(child => {
                        const childDot = getDotColor(child);
                        const isChildExpanded = expandedChildren.has(child.id);
                        return (
                          <div key={child.id} style={{ marginTop: "6px" }}>
                            <button
                              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "6px", padding: "7px 10px", width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "Inter, sans-serif" }}
                              onClick={e => { e.stopPropagation(); setExpandedChildren(prev => { const n = new Set(prev); n.has(child.id) ? n.delete(child.id) : n.add(child.id); return n; }); }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: childDot, flexShrink: 0 }} />
                                <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "11px", fontWeight: 500, flex: 1 }}>
                                  └─ {child.subject || child.title || (child.type === "reply" ? `Reply: ${child.classification?.toUpperCase()}` : "")}
                                </span>
                                {child.classification && (
                                  <span style={{ background: child.classification === "positive" ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)", color: child.classification === "positive" ? "#22C55E" : "#F59E0B", fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "3px", textTransform: "uppercase" }}>
                                    {child.classification}
                                  </span>
                                )}
                                <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "10px" }}>{child.date}</span>
                              </div>
                              {isChildExpanded && child.replyPreview && (
                                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", marginTop: "5px", lineHeight: 1.5 }}>{child.replyPreview}</p>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Quick Actions Grid ────────────────────────────────────────────────────────
// function QuickActionsGrid({ onQuickAction }: { onQuickAction: (action: string) => void }) {
//   const actions = [
//     { label: "Research Lead", icon: Search, color: "#F07C2D", action: "Research this lead" },
//     { label: "Generate Email", icon: PenLine, color: "#F07C2D", action: "Generate outreach email" },
//     { label: "Book Meeting", icon: CalendarDays, color: "#22C55E", action: "Book a meeting" },
//     { label: "View History", icon: Clock, color: "rgba(255,255,255,0.4)", action: "Check past interactions" },
//   ];
//   return (
//     <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
//       {actions.map(a => {
//         const Icon = a.icon;
//         return (
//           <button key={a.label} onClick={() => onQuickAction(a.action)}
//             style={{ background: "#111530", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "12px", cursor: "pointer", textAlign: "left", transition: "all 0.18s ease", fontFamily: "Inter, sans-serif" }}
//             onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#161B30"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)"; }}
//             onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#111530"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; }}
//           >
//             <Icon size={18} color={a.color} />
//             <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", marginTop: "8px", fontWeight: 500 }}>{a.label}</p>
//           </button>
//         );
//       })}
//     </div>
//   );
// }

// ─── Main Component ────────────────────────────────────────────────────────────
export function ActionHistoryPanel({
  emailDraft, pendingApproval, leadEmail, onSendEmail, onBookMeeting,
  onApprove, onDecline, onQuickAction, history,leads = [],
}: ActionHistoryPanelProps){
  const [activeTab, setActiveTab] = useState<"actions" | "leads" | "history" | "campaigns">("campaigns");
  const tabStyle = (tab: typeof activeTab) => ({
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "6px 2px",
    fontSize: "13px",
    fontWeight: 500,
    color: activeTab === tab ? "#F0F1F5" : "rgba(255,255,255,0.4)",
    borderBottom: activeTab === tab ? "2px solid #F07C2D" : "2px solid transparent",
    transition: "all 0.15s",
    fontFamily: "Inter, sans-serif",
    flexShrink: 0,
  });

  return (
    <aside style={{ width: "320px", minWidth: "320px", background: "#0D0F12", borderLeft: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "20px 20px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <h2 style={{ color: "#F0F1F5", fontSize: "16px", fontWeight: 500, margin: "0 0 12px" }}>Campaign Hub</h2>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
        {activeTab === "actions" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Pending Approval */}
            {pendingApproval && (
              <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderLeft: "3px solid #F59E0B", borderRadius: "10px", padding: "14px" }}>
                <p style={{ color: "#F59E0B", fontSize: "13px", fontWeight: 500, marginBottom: "4px" }}>Awaiting Your Approval</p>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginBottom: "12px" }}>
                  The agent is ready to send an email to <span style={{ color: "rgba(255,255,255,0.7)" }}>{leadEmail || "the lead"}</span>
                </p>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={onApprove} style={{ background: "#22C55E", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 500, padding: "7px 16px", cursor: "pointer", flex: 1, fontFamily: "Inter, sans-serif" }}>Approve</button>
                  <button onClick={onDecline} style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.4)", borderRadius: "8px", color: "#EF4444", fontSize: "13px", fontWeight: 500, padding: "7px 16px", cursor: "pointer", flex: 1, fontFamily: "Inter, sans-serif" }}>Decline</button>
                </div>
              </div>
            )}

            {/* Email Draft */}
            {emailDraft && (
              <div style={{ background: "#0D1128", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", fontWeight: 500 }}>Current Email Draft</span>
                  <span style={{ background: FLAG_LABELS[emailDraft.flag].bg, color: FLAG_LABELS[emailDraft.flag].color, fontSize: "10px", fontWeight: 500, padding: "2px 8px", borderRadius: "20px" }}>
                    {FLAG_LABELS[emailDraft.flag].label}
                  </span>
                </div>
                <p style={{ color: "#F0F1F5", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>{emailDraft.subject}</p>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", lineHeight: 1.6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                  {emailDraft.body}
                </p>
                <button style={{ color: "#F07C2D", fontSize: "12px", background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: "4px", fontFamily: "Inter, sans-serif" }}>View Full ↗</button>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
                  <button onClick={onSendEmail} style={{ background: "#F07C2D", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 500, padding: "9px 16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontFamily: "Inter, sans-serif", transition: "box-shadow 0.2s" }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(240,124,45,0.3)")}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = "none")}
                  >
                    <Send size={14} /> Send This Email
                  </button>
                  <button onClick={onBookMeeting} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", color: "rgba(255,255,255,0.7)", fontSize: "13px", fontWeight: 500, padding: "9px 16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontFamily: "Inter, sans-serif" }}>
                    <CalendarDays size={14} /> Book a Meeting
                  </button>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            {/* <div>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Quick Actions</p>
              <QuickActionsGrid onQuickAction={onQuickAction} />
            </div> */}
          </div>
        )}

        {activeTab === "history" && <EnhancedHistoryTimeline history={history} />}
        {activeTab === "campaigns" && <CampaignsTab />}
        {activeTab === "leads" && <LeadsTab leads={leads} />}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </aside>
  );
}
