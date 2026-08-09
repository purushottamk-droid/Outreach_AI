import {
  User, Mail, Building2, Globe, CheckCircle2, Check,
  Briefcase, Edit2, Save
} from "lucide-react";
import { useState } from "react";

// ─── Exported types ────────────────────────────────────────────────────────────
export interface YourProfile {
  name: string;
  email: string;
  company: string;
  whatYouSell: string;
}

export interface FindLeadsCriteria {
  industries: string[];
  jobRoles: string[];
  companySize: string;
  geography: string;
  limit: number;
}

interface LeadData {
  name: string;
  email: string;
  company: string;
  website: string;
  linkedin: string;
}

// interface LeadPanelProps {
//   leadData: LeadData;
//   onLeadChange: (data: LeadData) => void;
//   activeAgent: "coordinator" | "research" | "messaging" | null;
//   lastTool: string | null;
//   onProfileSave: (profile: YourProfile) => void;
//   onCriteriaSave: (criteria: FindLeadsCriteria) => void;
//   initialProfile?: YourProfile | null;
//   initialCriteria?: FindLeadsCriteria | null;
// }
interface LeadPanelProps {
  leadData: LeadData;
  onLeadChange: (data: LeadData) => void;
  activeAgent: "coordinator" | "research" | "messaging" | null;
  lastTool: string | null;
  onProfileSave: (profile: YourProfile) => void;
  onCriteriaSave: (criteria: FindLeadsCriteria) => void;
  initialProfile?: YourProfile | null;
  initialCriteria?: FindLeadsCriteria | null;
  sidebarCollapsed: boolean;
  onSidebarToggle: () => void;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Section A: Panel Header ───────────────────────────────────────────────────
function PanelHeader() {
  return (
    <div style={{ padding: "20px 20px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
      <div>
        <h2 style={{ color: "#F0F1F5", fontSize: "16px", fontWeight: 500, margin: "0 0 2px" }}>Lead Context</h2>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", margin: 0 }}>AI uses this to personalize outreach</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "5px", background: "rgba(240,124,45,0.12)", border: "1px solid rgba(240,124,45,0.25)", borderRadius: "6px", padding: "4px 8px", flexShrink: 0 }}>
        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#F07C2D", animation: "pulse-dot 2s ease-in-out infinite", display: "inline-block" }} />
        <span style={{ color: "#F07C2D", fontSize: "11px", fontWeight: 500 }}>Live Context</span>
      </div>
    </div>
  );
}

// ─── Section B: Your Profile ───────────────────────────────────────────────────
function YourProfileSection({
  initialProfile,
  onSave,
}: {
  initialProfile?: YourProfile | null;
  onSave: (profile: YourProfile) => void;
}) {
  const [editing, setEditing] = useState(!initialProfile);
  const [saved, setSaved] = useState(!!initialProfile);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const loggedInEmail = localStorage.getItem("user_id") || "";
  const [draft, setDraft] = useState<YourProfile>(
    initialProfile ?? { name: "", email: loggedInEmail, company: "", whatYouSell: "" }
  );

  const update = (field: keyof YourProfile, value: string) =>
    setDraft(p => ({ ...p, [field]: value }));

  const handleSave = () => {
    onSave(draft);
    setEditing(false);
    setSaved(true);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2000);
  };

  const handleCancel = () => {
    if (initialProfile) { setDraft(initialProfile); }
    setEditing(false);
  };

  const labelStyle: React.CSSProperties = {
    color: "rgba(255,255,255,0.35)",
    fontSize: "11px",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "4px",
    display: "block",
  };

  const iconColor = "rgba(255,255,255,0.3)";

  const viewRows = [
    { icon: User, value: draft.name },
    { icon: Mail, value: draft.email },
    { icon: Building2, value: draft.company },
    { icon: Briefcase, value: draft.whatYouSell },
  ];

  return (
    <div style={{ margin: "16px 20px 0", background: "#0D1128", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "14px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: editing ? "12px" : "10px" }}>
        <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Your Profile
        </span>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            style={{ background: "transparent", border: "1px solid rgba(240,124,45,0.35)", borderRadius: "6px", color: "#F07C2D", fontSize: "10px", fontWeight: 500, padding: "4px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontFamily: "Inter, sans-serif", transition: "all 0.15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(124,92,252,0.1)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <Edit2 size={10} /> Edit
          </button>
        )}
      </div>

      {/* View Mode */}
      {!editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {viewRows.map(({ icon: Icon, value }, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "7px 0", borderBottom: i < viewRows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
              <Icon size={13} color={iconColor} style={{ marginTop: "1px", flexShrink: 0 }} />
              <span style={{
                color: value ? "#F0F1F5" : "rgba(255,255,255,0.25)",
                fontSize: "13px",
                lineHeight: 1.5,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: i === 3 ? 2 : 1,
                WebkitBoxOrient: "vertical" as const,
              }}>
                {value || "—"}
              </span>
            </div>
          ))}
          {/* Saved indicator */}
          {saved && (
            <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "10px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              {/* <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22C55E", flexShrink: 0 }} /> */}
              {/* <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "10px" }}>Sending to AI</span> */}
              {showSavedToast && (
                <span style={{ color: "#22C55E", fontSize: "10px", marginLeft: "auto", animation: "fadeInOut 2s ease" }}>
                  ✓ Profile saved
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Edit Mode */
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div>
            <label style={labelStyle}>Your Name</label>
            <div style={{ background: "#111530", border: focused === "name" ? "1px solid rgba(240,124,45,0.6)" : "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", boxShadow: focused === "name" ? "0 0 0 2px rgba(240,124,45,0.15)" : "none", display: "flex", alignItems: "center", gap: "8px", padding: "0 10px", height: "38px", transition: "all 0.18s" }}>
              <User size={13} color={iconColor} />
              <input style={{ background: "transparent", border: "none", outline: "none", color: "#F0F1F5", fontSize: "13px", width: "100%", fontFamily: "Inter, sans-serif" }} placeholder="e.g. Alex Johnson" value={draft.name} onChange={e => update("name", e.target.value)} onFocus={() => setFocused("name")} onBlur={() => setFocused(null)} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Your Email</label>
            <div style={{ background: "#111530", border: focused === "email" ? "1px solid rgba(240,124,45,0.6)" : "1px solid rgba(255,255,255,0.08)", borderRadius: "8px",boxShadow: focused === "email" ? "0 0 0 2px rgba(240,124,45,0.15)" : "none",  display: "flex", alignItems: "center", gap: "8px", padding: "0 10px", height: "38px", transition: "all 0.18s" }}>
              <Mail size={13} color={iconColor} />
               <input style={{ background: "transparent", border: "none", outline: "none", color: "#F0F1F5", fontSize: "13px", width: "100%", fontFamily: "Inter, sans-serif", cursor: "not-allowed", opacity: 0.7 }} placeholder="alex@yourcompany.com" type="email" value={loggedInEmail} readOnly />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Your Company</label>
            <div style={{ background: "#111530", border: focused === "company" ? "1px solid rgba(240,124,45,0.6)" : "1px solid rgba(255,255,255,0.08)", borderRadius: "8px",boxShadow: focused === "company" ? "0 0 0 2px rgba(240,124,45,0.15)" : "none",  display: "flex", alignItems: "center", gap: "8px", padding: "0 10px", height: "38px", transition: "all 0.18s" }}>
              <Building2 size={13} color={iconColor} />
              <input style={{ background: "transparent", border: "none", outline: "none", color: "#F0F1F5", fontSize: "13px", width: "100%", fontFamily: "Inter, sans-serif" }} placeholder="e.g. Acme Corp" value={draft.company} onChange={e => update("company", e.target.value)} onFocus={() => setFocused("company")} onBlur={() => setFocused(null)} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>What You Sell</label>
            <div style={{ background: "#111530", border: focused === "sell" ? "1px solid rgba(240,124,45,0.6)" : "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", boxShadow: focused === "sell" ? "0 0 0 2px rgba(240,124,45,0.15)" : "none", display: "flex", gap: "8px", padding: "8px 10px", transition: "all 0.18s" }}>
              <Briefcase size={13} color={iconColor} style={{ marginTop: "2px", flexShrink: 0 }} />
              <textarea
                style={{ background: "transparent", border: "none", outline: "none", color: "#F0F1F5", fontSize: "13px", width: "100%", resize: "none", lineHeight: 1.6, height: "52px", fontFamily: "Inter, sans-serif" }}
                placeholder="e.g. AI-powered sales automation for B2B SaaS companies"
                value={draft.whatYouSell}
                onChange={e => update("whatYouSell", e.target.value)}
                onFocus={() => setFocused("sell")}
                onBlur={() => setFocused(null)}
              />
            </div>
          </div>
          {/* Save / Cancel */}
          <button
            onClick={handleSave}
            style={{ background: "#F07C2D", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 500, height: "36px", width: "100%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontFamily: "Inter, sans-serif", transition: "box-shadow 0.2s" }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(240,124,45,0.35)")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = "none")}
          >
            <Save size={13} /> Save Profile
          </button>
          {saved && (
            <button
              onClick={handleCancel}
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "rgba(255,255,255,0.5)", fontSize: "13px", height: "32px", width: "100%", cursor: "pointer", fontFamily: "Inter, sans-serif" }}
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Section E: Find Leads tab (Save Criteria flow) ───────────────────────────
const INDUSTRIES = ["SaaS", "Fintech", "Healthcare", "HR Tech", "Logistics"];
const JOB_ROLES = ["CTO", "VP Sales", "Founder", "Marketing Head", "CEO", "Head of Growth", "Engineering Manager", "CISO"];
const COMPANY_SIZES = ["1–50", "50–200", "200–1000", "1000+"];

function FindLeadsTab({
  initialCriteria,
  onSave,
}: {
  initialCriteria?: FindLeadsCriteria | null;
  onSave: (c: FindLeadsCriteria) => void;
}) {
  const [criteria, setCriteria] = useState<FindLeadsCriteria>(
    initialCriteria ?? {
      industries: ["Fintech"],
      jobRoles: ["CTO"],
      companySize: "",
      geography: "",
      limit: 25
}
  );
  const [focused, setFocused] = useState(false);
  const [isEditing, setIsEditing] = useState(!initialCriteria);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [hasSaved, setHasSaved] = useState(!!initialCriteria);

  const update = <K extends keyof FindLeadsCriteria>(field: K, value: FindLeadsCriteria[K]) =>
    setCriteria(p => ({ ...p, [field]: value }));

  const toggleSelection = (
  value: string,
  current: string[],
  max: number
) => {
  if (current.includes(value)) {
    return current.filter(v => v !== value);
  }

  if (current.length >= max) {
    return current;
  }

  return [...current, value];
};

  // Simulate dynamic match count
  

  const handleSave = () => {
    onSave(criteria);
    setIsEditing(false);
    setHasSaved(true);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2000);
  };

  const labelStyle: React.CSSProperties = {
    color: "rgba(255,255,255,0.35)",
    fontSize: "11px",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "6px",
    display: "block",
  };

  const chipStyle = (selected: boolean, readOnly: boolean): React.CSSProperties => ({
    background: selected ? "#F07C2D" : "#111530",
    border: selected ? "none" : "1px solid rgba(255,255,255,0.12)",
    borderRadius: "8px",
    color: selected ? "#fff" : "rgba(255,255,255,0.6)",
    fontSize: "12px",
    fontWeight: selected ? 500 : 400,
    padding: "6px 14px",
    cursor: readOnly ? "default" : "pointer",
    fontFamily: "Inter, sans-serif",
    transition: "all 0.15s ease",
    opacity: readOnly && !selected ? 0.5 : 1,
  });

  return (
    <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Target Industry */}
      <div>
        <label style={labelStyle}>Target Industry</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {INDUSTRIES.map(ind => (
            <button
              key={ind}
              onClick={() =>
                  isEditing &&
                  update(
                    "industries",
                    toggleSelection(
                      ind,
                      criteria.industries,
                      3
                    )
                  )
                }
              style={chipStyle(criteria.industries.includes(ind), !isEditing)}
              >
              {ind}
            </button>
          ))}
        </div>
      </div>

      {/* Target Job Role */}
      <div>
        <label style={labelStyle}>Target Job Role</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {JOB_ROLES.map(role => (
            <button
              key={role}
              onClick={() =>
                isEditing &&
                update(
                  "jobRoles",
                  toggleSelection(
                    role,
                    criteria.jobRoles,
                    4
                  )
                )
              }
              style={chipStyle(criteria.jobRoles.includes(role), !isEditing)}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Company Size */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
          <span style={labelStyle}>Company Size</span>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px" }}>optional</span>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {COMPANY_SIZES.map(size => (
            <button
              key={size}
              onClick={() => isEditing && update("companySize", size)}
              style={{ ...chipStyle(criteria.companySize === size, !isEditing), flex: 1, padding: "6px 4px", textAlign: "center" as const, borderRadius: "8px" }}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Geography */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
          <span style={{ ...labelStyle, marginBottom: 0 }}>Geography</span>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px" }}>optional</span>
        </div>
        <div style={{ background: "#111530", border: focused ? "1px solid rgba(240,124,45,0.6)" : "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", boxShadow: focused ? "0 0 0 2px rgba(240,124,45,0.15)" : "none", display: "flex", alignItems: "center", gap: "8px", padding: "0 10px", height: "38px", transition: "all 0.18s", opacity: !isEditing ? 0.6 : 1 }}>
          <Globe size={13} color="rgba(255,255,255,0.3)" />
          <input
            style={{ background: "transparent", border: "none", outline: "none", color: "#F0F1F5", fontSize: "13px", width: "100%", fontFamily: "Inter, sans-serif" }}
            placeholder="e.g. USA, India, Global"
            value={criteria.geography}
            disabled={!isEditing}
            onChange={e => update("geography", e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </div>
      </div>

      {/* Lead Count */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={labelStyle}>Lead Count</span>
          <span style={{ color: "#F07C2D", fontSize: "13px", fontWeight: 500 }}>{criteria.limit} leads</span>
        </div>
        <input
          type="range"
          min={10}
          max={50}
          step={5}
          value={criteria.limit}
          disabled={!isEditing}
          onChange={e => update("limit", Number(e.target.value))}
          style={{ width: "100%", accentColor: "#F07C2D", cursor: isEditing ? "pointer" : "not-allowed", opacity: !isEditing ? 0.6 : 1 }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2px" }}>
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "10px" }}>10</span>
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "10px" }}>50</span>
        </div>
      </div>

      

      {/* Save Criteria / Saved state */}
      {isEditing ? (
        <button
          onClick={handleSave}
          style={{ background: "#F07C2D", border: "none", borderRadius: "10px", color: "#fff", fontSize: "14px", fontWeight: 500, height: "44px", width: "100%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "Inter, sans-serif", transition: "box-shadow 0.2s" }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(240,124,45,0.35)")}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = "none")}
        >
          <Save size={15} /> Save Criteria
        </button>
      ) : (
        <div style={{ display: "flex", gap: "8px" }}>
          <button style={{ flex: 1, background: "transparent", border: "1px solid rgba(34,197,94,0.4)", borderRadius: "8px", color: "#22C55E", fontSize: "12px", fontWeight: 500, height: "36px", cursor: "default", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
            <Check size={12} /> Saved
          </button>
          <button
            onClick={() => setIsEditing(true)}
            style={{ flex: 1, background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 500, height: "36px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}
          >
            Edit
          </button>
        </div>
      )}

      {/* Context saved indicator */}
      {hasSaved && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {/* <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22C55E", flexShrink: 0 }} /> */}
          {/* <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", fontStyle: "italic" }}>
            {showSavedToast ? "Criteria saved ✓" : "Find Leads criteria saved to AI context"}
          </span> */}
        </div>
      )}

     
    </div>
  );
}

// ─── Section F: Lead Score Donut ───────────────────────────────────────────────
function LeadScoreDonut({ score }: { score: number }) {
  const r = 34;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const bars = [
    { label: "Research Depth", value: Math.min(100, score * 0.9 + 5) },
    { label: "Personalization", value: Math.min(100, score * 0.85) },
    { label: "Engagement", value: Math.min(100, score * 0.95 + 3) },
  ];
  return (
    <div style={{ margin: "0 20px", background: "#0D1128", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div style={{ position: "relative", width: 80, height: 80, flexShrink: 0 }}>
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
            <circle cx="40" cy="40" r={r} fill="none" stroke="#F07C2D" strokeWidth="7"
              strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
              style={{ transform: "rotate(-90deg)", transformOrigin: "40px 40px", transition: "stroke-dashoffset 0.6s ease" }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#F07C2D", fontSize: "20px", fontWeight: 600, lineHeight: 1 }}>{score}</span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "9px", marginTop: "2px" }}>Lead Score</span>
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "7px" }}>
          {bars.map(bar => (
            <div key={bar.label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px" }}>{bar.label}</span>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px" }}>{Math.round(bar.value)}%</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "4px", height: "3px" }}>
                <div style={{ background: "#F07C2D", width: `${bar.value}%`, height: "3px", borderRadius: "4px", transition: "width 0.6s ease" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Section G: Agent Status ───────────────────────────────────────────────────
function AgentStatusCard({
  activeAgent,
  lastTool,
}: {
  activeAgent: "coordinator" | "research" | "messaging" | null;
  lastTool: string | null;
}) {
  return (
    <div style={{ margin: "0 20px 20px", background: "#0D1128", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "14px" }}>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
        Agent Status
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {[
          { key: "coordinator" as const, label: "Coordinator", dotColor: "rgba(255,255,255,0.7)", idleColor: "rgba(255,255,255,0.2)", textColor: "rgba(255,255,255,0.6)", activeText: "rgba(255,255,255,0.9)" },
          { key: "research" as const, label: "Research Agent", dotColor: "#F07C2D", idleColor: "rgba(240,124,45,0.3)", textColor: "rgba(255,255,255,0.4)", activeText: "#F07C2D" },
          { key: "messaging" as const, label: "Messaging Agent", dotColor: "#22C55E", idleColor: "rgba(34,197,94,0.3)", textColor: "rgba(255,255,255,0.4)", activeText: "#34D399" },
        ].map(agent => {
          const isActive = activeAgent === agent.key;
          return (
            <div key={agent.key} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ position: "relative", flexShrink: 0, width: 8, height: 8 }}>
                {isActive && (
                  <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: agent.dotColor, opacity: 0.7, animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite" }} />
                )}
                <span style={{ display: "block", width: 8, height: 8, borderRadius: "50%", background: isActive ? agent.dotColor : agent.idleColor, position: "relative", zIndex: 1 }} />
              </div>
              <span style={{ color: isActive ? agent.activeText : agent.textColor, fontSize: "12px", fontWeight: isActive ? 500 : 400, flex: 1 }}>
                {agent.label}
              </span>
              {isActive && (
                <span style={{ color: agent.dotColor, fontSize: "10px", opacity: 0.8 }}>active</span>
              )}
            </div>
          );
        })}
      </div>
      
    </div>
  );
}

// ─── Main LeadPanel ────────────────────────────────────────────────────────────
export function LeadPanel({
  leadData, onLeadChange, activeAgent, lastTool,
  onProfileSave, onCriteriaSave, initialProfile, initialCriteria,
  sidebarCollapsed, onSidebarToggle,
}: LeadPanelProps) {
  const [tab, setTab] = useState<"profile" | "find">("profile");
  const [focused, setFocused] = useState<string | null>(null);
  const [profileCollapsed, setProfileCollapsed] = useState(false);
  const [criteriaCollapsed, setCriteriaCollapsed] = useState(false);

  const filledFields = [leadData.name, leadData.email, leadData.company, leadData.website, leadData.linkedin].filter(Boolean).length;
  const score = Math.min(96, 20 + filledFields * 15 + (isValidEmail(leadData.email) ? 6 : 0));

  const inputBox = (field: string): React.CSSProperties => ({
    background: "#111530",
    border: focused === field ? "1px solid rgba(240,124,45,0.6)" : "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px",
    boxShadow: focused === field ? "0 0 0 2px rgba(240,124,45,0.15)" : "none",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "0 10px",
    height: "38px",
    transition: "all 0.18s ease",
  });

  const labelStyle: React.CSSProperties = {
    color: "rgba(255,255,255,0.35)",
    fontSize: "11px",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "4px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "0 0 8px",
    fontSize: "14px",
    fontWeight: 500,
    color: active ? "#F0F1F5" : "rgba(255,255,255,0.4)",
    borderBottom: active ? "2px solid #F07C2D" : "2px solid transparent",
    transition: "all 0.15s ease",
    fontFamily: "Inter, sans-serif",
  });

  const iconColor = "rgba(255,255,255,0.3)";

  if (sidebarCollapsed) {
    return (
      <aside style={{
        width: "48px", minWidth: "48px", background: "#0D0F12",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex", flexDirection: "column", alignItems: "center",
        paddingTop: "16px", gap: "16px", fontFamily: "Inter, sans-serif",
        transition: "width 0.3s ease"
      }}>
        <button
          onClick={onSidebarToggle}
          title="Lead Context"
          style={{
            background: "rgba(240,124,45,0.12)", border: "1px solid rgba(240,124,45,0.3)",
            borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#F07C2D"
          }}
        >
          ›
        </button>
        <style>{`
          @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
          @keyframes ping { 75%, 100% { transform: scale(2.5); opacity: 0; } }
          @keyframes fadeInOut { 0% { opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; } }
        `}</style>
      </aside>
    );
  }

  return (
    <aside style={{
      width: "320px", minWidth: "320px", background: "#0D0F12",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column", overflowY: "hidden",
      fontFamily: "Inter, sans-serif", transition: "width 0.3s ease"
    }}>
      {/* Header with collapse button */}
      <div style={{ padding: "16px 20px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ color: "#F0F1F5", fontSize: "16px", fontWeight: 500, margin: "0 0 2px" }}>Lead Context</h2>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", margin: 0 }}>AI uses this to personalize outreach</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px", background: "rgba(240,124,45,0.12)", border: "1px solid rgba(240,124,45,0.25)", borderRadius: "6px", padding: "4px 8px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#F07C2D", animation: "pulse-dot 2s ease-in-out infinite", display: "inline-block" }} />
            <span style={{ color: "#F07C2D", fontSize: "11px", fontWeight: 500 }}>Live</span>
          </div>
          <button
            onClick={onSidebarToggle}
            title="Collapse sidebar"
            style={{
              background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "6px", width: "26px", height: "26px", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "rgba(255,255,255,0.4)", fontSize: "14px"
            }}
          >
            ‹
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ padding: "16px 20px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", gap: "20px" }}>
          <button style={tabStyle(tab === "profile")} onClick={() => setTab("profile")}>Your Profile</button>
          <button style={tabStyle(tab === "find")} onClick={() => setTab("find")}>Find Leads</button>
        </div>
      </div>

      {/* Scrollable content area */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Profile Tab */}
        {tab === "profile" && !profileCollapsed && (
          <YourProfileSection
            initialProfile={initialProfile}
            onSave={(profile) => {
              onProfileSave(profile);
              setProfileCollapsed(true);
            }}
          />
        )}
        {tab === "profile" && profileCollapsed && (
          <div style={{ padding: "16px 20px" }}>
            <div style={{
              background: "#0D1128", border: "1px solid rgba(240,124,45,0.2)",
              borderRadius: "12px", padding: "12px 14px",
              display: "flex", alignItems: "center", gap: "10px"
            }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "50%",
                background: "rgba(240,124,45,0.15)", border: "1px solid rgba(240,124,45,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
              }}>
                <span style={{ color: "#F07C2D", fontSize: "13px", fontWeight: 700 }}>
                  {initialProfile?.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: "#F0F1F5", fontSize: "13px", fontWeight: 500, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {initialProfile?.name || "Your Name"}
                </p>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {initialProfile?.company || "Your Company"}
                </p>
              </div>
              <span style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E", fontSize: "10px", fontWeight: 500, padding: "2px 8px", borderRadius: "20px", flexShrink: 0 }}>
                ✓ Saved
              </span>
              <button
                onClick={() => setProfileCollapsed(false)}
                style={{ background: "transparent", border: "1px solid rgba(240,124,45,0.35)", borderRadius: "6px", color: "#F07C2D", fontSize: "10px", fontWeight: 500, padding: "4px 10px", cursor: "pointer", fontFamily: "Inter, sans-serif", flexShrink: 0 }}
              >
                Edit
              </button>
            </div>
            {initialProfile?.whatYouSell && (
              <div style={{ marginTop: "8px", background: "rgba(240,124,45,0.06)", border: "1px solid rgba(240,124,45,0.12)", borderRadius: "8px", padding: "7px 12px" }}>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 2px" }}>Selling</p>
                <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "12px", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {initialProfile.whatYouSell}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Find Leads Tab */}
        {tab === "find" && !criteriaCollapsed && (
          <FindLeadsTab
            initialCriteria={initialCriteria}
            onSave={(criteria) => {
              onCriteriaSave(criteria);
              setCriteriaCollapsed(true);
            }}
          />
        )}
        {tab === "find" && criteriaCollapsed && (
          <div style={{ padding: "16px 20px" }}>
            <div style={{
              background: "#0D1128", border: "1px solid rgba(240,124,45,0.2)",
              borderRadius: "12px", padding: "12px 14px",
              display: "flex", alignItems: "center", gap: "10px"
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: "#F0F1F5", fontSize: "13px", fontWeight: 500, margin: 0 }}>ICP Saved</p>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {initialCriteria?.industries?.join(", ")} · {initialCriteria?.jobRoles?.join(", ")}
                </p>
              </div>
              <span style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E", fontSize: "10px", fontWeight: 500, padding: "2px 8px", borderRadius: "20px", flexShrink: 0 }}>
                ✓ Saved
              </span>
              <button
                onClick={() => setCriteriaCollapsed(false)}
                style={{ background: "transparent", border: "1px solid rgba(240,124,45,0.35)", borderRadius: "6px", color: "#F07C2D", fontSize: "10px", fontWeight: 500, padding: "4px 10px", cursor: "pointer", fontFamily: "Inter, sans-serif", flexShrink: 0 }}
              >
                Edit
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes ping { 75%, 100% { transform: scale(2.5); opacity: 0; } }
        @keyframes fadeInOut { 0% { opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; } }
      `}</style>
    </aside>
  );
}