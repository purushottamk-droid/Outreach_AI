import { useState, useEffect } from "react";
import { X, Mail } from "lucide-react";
import { LeadItem } from "./ChatPanel";

export function LeadHistoryModal({ lead, onClose }: { lead: LeadItem; onClose: () => void }) {
  const [tab, setTab] = useState<"conversation" | "meetings">("conversation");
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem("user_id") || "";

  useEffect(() => {
    setLoading(true);
    fetch(`https://outreach-ai-621913909275.us-central1.run.app/api/history/${lead.id}?user_id=${userId}`)
      .then(r => r.json())
      .then(data => { setHistory(data || []); setLoading(false); })
      .catch(() => { setHistory([]); setLoading(false); });

    const interval = setInterval(() => {
      fetch(`https://outreach-ai-621913909275.us-central1.run.app/api/history/${lead.id}?user_id=${userId}`)
        .then(r => r.json())
        .then(data => { setHistory(data || []); })
        .catch(() => {});
    }, 30000);

    return () => clearInterval(interval);
  }, [lead.id]);

 const filtered = history
  .filter(item => {
    if (tab === "conversation") return item.type === "email" || item.type === "reply";
    if (tab === "meetings") return item.type === "meeting";
    return false;
  })
  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const tabs = [
  { key: "conversation" as const, label: "Conversation" },
  { key: "meetings" as const, label: "Meetings" },
];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
      <div style={{ background: "#0D1128", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", width: "600px", maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "22px", height: "22px", borderRadius: "6px", background: "rgba(240,124,45,0.1)", border: "1px solid rgba(240,124,45,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Mail size={11} color="#F07C2D" />
            </div>
            <div>
              <p style={{ color: "#F0F1F5", fontSize: "15px", fontWeight: 600, margin: 0 }}>Past Interactions</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: 0 }}>{lead.name} · {lead.company}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", padding: "4px" }}>
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ flex: 1, padding: "12px", background: "none", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 500, fontFamily: "Inter, sans-serif", color: tab === t.key ? "#F07C2D" : "rgba(255,255,255,0.4)", borderBottom: tab === t.key ? "2px solid #F07C2D" : "2px solid transparent" }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {loading ? (
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", textAlign: "center", padding: "30px 0" }}>Loading...</p>
          ) : filtered.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", textAlign: "center", padding: "30px 0" }}>No {tab} found.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {filtered.map(item => {
                const isOutbound = item.direction === "outbound" || (item.type === "email" && !item.reply_text);
                const time = new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                const date = new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                return (
                  <div key={item.id} style={{ display: "flex", flexDirection: "column", alignItems: isOutbound ? "flex-end" : "flex-start", marginBottom: "12px" }}>
                    <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "10px", marginBottom: "4px", paddingLeft: isOutbound ? 0 : "4px", paddingRight: isOutbound ? "4px" : 0 }}>{date}</span>
                    <div style={{ maxWidth: "85%", background: isOutbound ? "rgba(240,124,45,0.12)" : "#1E2230", border: `1px solid ${isOutbound ? "rgba(240,124,45,0.25)" : "rgba(255,255,255,0.06)"}`, borderRadius: isOutbound ? "14px 14px 4px 14px" : "4px 14px 14px 14px", padding: "10px 14px" }}>
                      {item.subject && <p style={{ color: isOutbound ? "#F07C2D" : "#F0F1F5", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>{item.subject}</p>}
                      {item.body && <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{item.body}</p>}
                      {item.reply_text && <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{item.reply_text}</p>}
                      {item.reply_classification && (
                        <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "4px", marginTop: "6px", display: "inline-block", background: item.reply_classification === "POSITIVE" ? "rgba(34,197,94,0.12)" : item.reply_classification === "NEUTRAL" ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)", color: item.reply_classification === "POSITIVE" ? "#22C55E" : item.reply_classification === "NEUTRAL" ? "#F59E0B" : "#EF4444", textTransform: "uppercase" as const }}>
                          {item.reply_classification}
                        </span>
                      )}
                      {item.event_link && <a href={item.event_link} target="_blank" rel="noopener noreferrer" style={{ color: "#F07C2D", fontSize: "12px", marginTop: "6px", display: "block" }}>Join Meeting →</a>}
                      <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "10px", marginTop: "6px", textAlign: isOutbound ? "right" : "left" }}>{time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}