import { useState, useEffect } from "react";
import { X, Mail, Phone, Linkedin, Building2, Copy, ExternalLink, ChevronRight, Check } from "lucide-react";

export interface LeadProfile {
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
  enriching?: boolean;
}

interface HistoryEntry {
  id: string;
  type: "email" | "meeting" | "reply";
  date: string;
  subject?: string;
  status?: "sent" | "failed";
  classification?: "positive" | "neutral" | "negative";
  preview?: string;
}

interface LeadProfileModalProps {
  lead: LeadProfile;
  onClose: () => void;
}

const STATUS_CONFIG = {
  new: { label: "New", color: "rgba(255,255,255,0.5)", bg: "rgba(255,255,255,0.08)" },
  contacted: { label: "Contacted", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  replied: { label: "Replied", color: "#22C55E", bg: "rgba(34,197,94,0.12)" },
  cold: { label: "Cold", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
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



function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      style={{ background: "none", border: "none", cursor: "pointer", color: copied ? "#22C55E" : "rgba(255,255,255,0.3)", padding: "2px" }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

function CompanySummary({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 200;
  const displayText = expanded ? text : text.slice(0, 200) + (isLong ? "..." : "");

  return (
    <div style={{ marginBottom: "12px" }}>
      <p style={{
        color: "rgba(255,255,255,0.55)",
        fontSize: "13px",
        lineHeight: 1.65,
        margin: "0 0 8px"
      }}>
        {displayText}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "6px",
            color: "#F07C2D",
            fontSize: "12px",
            fontWeight: 500,
            padding: "4px 12px",
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            transition: "all 0.15s"
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = "rgba(240,124,45,0.1)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,124,45,0.3)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
          }}
        >
          {expanded ? "▲ Show Less" : "▼ Read More"}
        </button>
      )}
    </div>
  );
}

export function LeadProfileModal({ lead, onClose }: LeadProfileModalProps) {
  const status = STATUS_CONFIG[lead.status];
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    fetch(`https://outreach-ai-621913909275.us-central1.run.app/api/history/${lead.id}`)
      .then(r => r.json())
      .then((data: any[]) => {
        if (data && data.length > 0) {
          const mapped = data.map(item => ({
            id: item.id,
            type: item.type as "email" | "meeting" | "reply",
            date: item.created_at,
            subject: item.subject || item.reply_text,
            status: item.status as "sent" | "failed",
            classification: item.reply_classification as "positive" | "neutral" | "negative",
            preview: item.body || item.reply_text
          }));
          setHistory(mapped);
        } else {
          setHistory([
            { id: "mh1", type: "email", date: "May 15, 2026 · 2:34 PM", subject: "AI-powered RevOps that fits your Salesforce + Outreach stack", status: "sent" },
            { id: "mh2", type: "reply", date: "May 16, 2026 · 10:12 AM", classification: "positive", preview: "Thanks for reaching out! This looks really interesting. Can we schedule a quick call..." },
            { id: "mh3", type: "meeting", date: "May 20, 2026 · 3:00 PM IST", subject: "RevOps AI Demo", status: "sent" },
          ]);
        }
      })
      .catch(() => setHistory([
        { id: "mh1", type: "email", date: "May 15, 2026 · 2:34 PM", subject: "AI-powered RevOps that fits your Salesforce + Outreach stack", status: "sent" },
        { id: "mh2", type: "reply", date: "May 16, 2026 · 10:12 AM", classification: "positive", preview: "Thanks for reaching out! This looks really interesting. Can we schedule a quick call..." },
        { id: "mh3", type: "meeting", date: "May 20, 2026 · 3:00 PM IST", subject: "RevOps AI Demo", status: "sent" },
      ]));
  }, [lead.id]);
  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 40 }}
      />
      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "380px",
          background: "#0D1128",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          animation: "slideFromRight 0.28s ease-out",
          fontFamily: "Inter, sans-serif",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
            <div>
              <h2 style={{ color: "#F0F1F5", fontSize: "18px", fontWeight: 600, margin: "0 0 4px" }}>{lead.name}</h2>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0 }}>{lead.title} · {lead.company}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
              <span style={{ background: status.bg, color: status.color, fontSize: "11px", fontWeight: 500, padding: "3px 10px", borderRadius: "20px" }}>
                {status.label}
              </span>
              <button
                onClick={onClose}
                style={{ background: "#111530", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.5)" }}
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "20px", flex: 1, overflowY: "auto" }}>
          {/* Contact Info */}
          <section>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
              Contact Info
            </p>
            <div
              style={{ background: "#111530", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", overflow: "hidden" }}
            >
              {[
                { icon: Mail, label: lead.email, href: `mailto:${lead.email}`, copyText: lead.email },
                ...(lead.phone ? [{ icon: Phone, label: lead.phone, href: `tel:${lead.phone}`, copyText: lead.phone }] : []),
                ...(lead.linkedin ? [{ icon: Linkedin, label: lead.linkedin, href: "#", copyText: lead.linkedin }] : []),
                { icon: Building2, label: lead.company, href: undefined, copyText: lead.company },
              ].map((item, i, arr) => {
                const Icon = item.icon;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <Icon size={14} color="rgba(255,255,255,0.3)" />
                    {item.href ? (
                      <a href={item.href} style={{ color: "#F07C2D", fontSize: "13px", flex: 1, textDecoration: "none" }}>{item.label}</a>
                    ) : (
                      <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", flex: 1 }}>{item.label}</span>
                    )}
                    <CopyButton text={item.copyText} />
                  </div>
                );
              })}
            </div>
          </section>

          {/* Company Intelligence */}
          <section>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
              Company Intelligence
            </p>
            {lead.enriching ? (
              <div style={{ background: "#111530", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "14px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[100, 80, 65].map((w, i) => (
                    <div key={i} style={{ height: "12px", borderRadius: "6px", background: "linear-gradient(90deg, #252A3A 25%, #2E3448 50%, #252A3A 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s ease-in-out infinite", width: `${w}%` }} />
                  ))}
                </div>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", marginTop: "12px", textAlign: "center" }}>Enriching company data...</p>
              </div>
            ) : (
              <div style={{ background: "#111530", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "14px" }}>
                {/* {lead.companySummary && (
                  <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", lineHeight: 1.65, marginBottom: "12px" }}>
                    {lead.companySummary}
                  </p>
                )} */}
                {lead.companySummary && (
                  <CompanySummary text={lead.companySummary} />
                )}
                {lead.techStack && lead.techStack.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {lead.techStack.map(tech => {
                      const colors = TECH_COLORS[tech] || { color: "rgba(255,255,255,0.5)", bg: "rgba(255,255,255,0.06)" };
                      return (
                        <span key={tech} style={{ background: colors.bg, color: colors.color, fontSize: "11px", padding: "3px 8px", borderRadius: "6px", fontWeight: 500 }}>
                          {tech}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Interaction History
          <section>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
              Past Interactions
            </p>
            <div style={{ position: "relative", paddingLeft: "18px" }}>
              <div style={{ position: "absolute", left: "5px", top: 0, bottom: 0, width: "1px", background: "rgba(255,255,255,0.08)" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {history.map(item => {
                  const dotColor = item.type === "reply"
                    ? item.classification === "positive" ? "#22C55E" : item.classification === "neutral" ? "#F59E0B" : "#EF4444"
                    : item.status === "sent" ? "#22C55E" : item.status === "failed" ? "#EF4444" : "#F07C2D";

                  return (
                    <div key={item.id} style={{ position: "relative" }}>
                      <div style={{ position: "absolute", left: "-15px", top: "8px", width: "8px", height: "8px", borderRadius: "50%", background: dotColor, boxShadow: `0 0 5px ${dotColor}80` }} />
                      <div style={{ background: "#111530", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", padding: "10px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "10px" }}>{item.date}</span>
                          {item.type === "reply" && item.classification && (
                            <span style={{
                              fontSize: "9px",
                              fontWeight: 700,
                              padding: "1px 6px",
                              borderRadius: "4px",
                              background: item.classification === "positive" ? "rgba(34,197,94,0.12)" : item.classification === "neutral" ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)",
                              color: item.classification === "positive" ? "#22C55E" : item.classification === "neutral" ? "#F59E0B" : "#EF4444",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}>
                              {item.classification}
                            </span>
                          )}
                        </div>
                        {item.subject && (
                          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", fontWeight: 500 }}>{item.subject}</p>
                        )}
                        {item.preview && (
                          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", lineHeight: 1.5, marginTop: "3px", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                            {item.preview}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section> */}

          {/* CTA */}
          {/* <button
            style={{ background: "#7C5CFC", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 500, padding: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontFamily: "Inter, sans-serif", transition: "box-shadow 0.2s" }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(124,92,252,0.3)")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = "none")}
          >
            Generate Outreach Email <ExternalLink size={13} />
          </button> */}
        </div>
      </div>

      <style>{`
        @keyframes slideFromRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </>
  );
}
