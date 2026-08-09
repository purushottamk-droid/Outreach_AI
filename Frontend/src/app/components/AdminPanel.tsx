import { useState, useEffect } from "react";
import { RefreshCw, CheckCircle2, XCircle, Clock, Zap, Activity, Database, AlertTriangle } from "lucide-react";

const BASE_URL = "https://outreach-ai-621913909275.us-central1.run.app";
const WS_URL = "wss://outreach-ai-621913909275.us-central1.run.app";

interface Company {
  id: string;
  name: string;
  company: string;
  email: string;
  company_website: string;
  company_summary: string | null;
  tech_stack: string | null;
  enriched_at: string | null;
  industry: string;
}

interface ActivityLog {
  id: string;
  company: string;
  status: "scraping" | "success" | "failed" | "pending";
  message: string;
  time: string;
}

interface AdminPanelProps {
  userId: string;
}

const ADMIN_EMAILS = [
  "purushottam.k@atgeirsolutions.com",
  "vishal.wilson@atgeirsolutions.com",
  "gunjan@atgeirsolutions.com",
  "atgeir_generative_ai@atgeirsolutions.com",
  "arvind.dutt@atgeirsolutions.com",
  "ronak.sikh@atgeirsolutions.com"
];

export default function AdminPanel({ userId }: AdminPanelProps) {

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "stale" | "fresh" | "never">("all");

  // ── Grouped company interface ──
interface GroupedCompany {
  id: string;              // first lead_id (used for Sync)
  company: string;
  company_website: string;
  tech_stack: string | null;
  enriched_at: string | null;
  industry: string;
  lead_count: number;      // how many leads belong to this company
}
  // ── Check admin access ──
  const isAdmin = ADMIN_EMAILS.includes(userId);

  // ── Fetch companies ──
  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/admin/companies`, {
        headers: { "x-user-id": userId }
      });
      const data = await res.json();
      setCompanies(data.companies || []);
    } catch {
      addLog("system", "Failed to fetch companies", "failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchCompanies();
  }, []);

  

// ── WebSocket — Live Activity real-time updates ──
useEffect(() => {
    if (!isAdmin || !userId) return;

    const ws = new WebSocket(`${WS_URL}/ws/${userId}`);

    ws.onopen = () => {
        console.log("[Admin WS] Connected");
    };

    ws.onmessage = (event) => {
        try {
            const msg = JSON.parse(event.data);

            // ── Enrich single progress ──
            if (msg.type === "enrich_progress") {
                addLog(
                    msg.company,
                    msg.message,
                    msg.status as ActivityLog["status"]
                );
                // Refresh table when a company succeeds
                if (msg.status === "success") {
                    fetchCompanies();
                }
            }

            // ── Bulk started ──
            if (msg.type === "enrich_bulk_started") {
                addLog(
                    "System",
                    msg.message,
                    "scraping"
                );
            }

            // ── Bulk complete ──
            if (msg.type === "enrich_bulk_complete") {
                addLog(
                    "System",
                    msg.message,
                    "success"
                );
                // Refresh full table after bulk done
                fetchCompanies();
                // Stop the refreshing spinner
                setRefreshingAll(false);
            }

        } catch (e) {
            console.error("[Admin WS] Parse error", e);
        }
    };

    ws.onerror = (e) => {
        console.error("[Admin WS] Error", e);
    };

    ws.onclose = () => {
        console.log("[Admin WS] Disconnected");
    };

    // Cleanup on unmount
    return () => ws.close();

}, [isAdmin, userId]);
  // ── Activity log helper ──
  const addLog = (company: string, message: string, status: ActivityLog["status"]) => {
    setActivityLog(prev => [{
      id: Math.random().toString(36).slice(2),
      company,
      status,
      message,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }, ...prev].slice(0, 50));
  };

  const updateLog = (company: string, message: string, status: ActivityLog["status"]) => {
    setActivityLog(prev => prev.map(log =>
        log.company === company
            ? { ...log, message, status }
            : log
    ));
};

  // ── Refresh single company ──
  const handleRefreshSingle = async (company: GroupedCompany) => {
    setRefreshingId(company.id);

    // ← ONE log added immediately
    addLog(company.company, `Scraping ${company.company}...`, "scraping");

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 120000);

        const res = await fetch(
            `${BASE_URL}/api/admin/enrich/${company.id}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-user-id": userId
                },
                signal: controller.signal
            }
        );
        clearTimeout(timeout);

        const data = await res.json();

        if (data.status === "skipped") {
            // ← UPDATE same card, don't add new
            updateLog(company.company, `Already enriched recently`, "pending");
        } else if (data.status === "success") {
            // ← UPDATE same card, don't add new
            updateLog(company.company, `✅ ${company.company} updated successfully`, "success");
            await fetchCompanies();
        } else {
            // ← UPDATE same card, don't add new
            updateLog(company.company, `❌ ${company.company} failed`, "failed");
        }

    } catch (err: any) {
        if (err?.name === "AbortError") {
            // ← UPDATE same card, don't add new
            updateLog(company.company, `⏱ Sync timed out — checking status...`, "pending");
            await fetchCompanies();
        } else {
            // ← UPDATE same card, don't add new
            updateLog(company.company, `❌ Network error`, "failed");
        }
    } finally {
        setRefreshingId(null);
    }
};

  // ── Refresh all stale ──
  // ── Refresh all stale ──
  const handleRefreshAll = async () => {
    setRefreshingAll(true);
    addLog("System", "Starting bulk enrichment...", "scraping");
    try {
        const res = await fetch(`${BASE_URL}/api/admin/enrich/all`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-user-id": userId
            },
            body: JSON.stringify({ user_id: userId })
        });
        const data = await res.json();
        addLog("System", `Bulk enrichment started — ${data.total} companies queued`, "scraping");

        // Poll every 10 seconds to refresh table
        const pollInterval = setInterval(async () => {
            await fetchCompanies();
        }, 10000);

        // Stop polling after 10 minutes max
        setTimeout(() => {
            clearInterval(pollInterval);
            setRefreshingAll(false);
            addLog("System", "Bulk enrichment complete", "success");
            fetchCompanies();
        }, 600000);

    } catch {
        addLog("System", "Bulk enrichment failed", "failed");
        setRefreshingAll(false);
    }
};
  // ── Staleness check ──
  const getEnrichmentStatus = (enriched_at: string | null) => {
    if (!enriched_at) return "never";

    // BigQuery returns "2026-06-18 02:18:22.992490 UTC"
    // Convert to valid ISO format for browser parsing
    const normalized = enriched_at
        .replace(" UTC", "Z")      // "...992490 UTC" → "...992490Z"
        .replace(" ", "T");        // "2026-06-18 02..." → "2026-06-18T02..."

    const enrichedDate = new Date(normalized);

    // Safety check — if still invalid
    if (isNaN(enrichedDate.getTime())) {
        console.warn("Invalid enriched_at:", enriched_at);
        return "never";
    }

    // Date-only comparison in UTC
    const enrichedDay = Date.UTC(
        enrichedDate.getUTCFullYear(),
        enrichedDate.getUTCMonth(),
        enrichedDate.getUTCDate()
    );
    const todayDay = Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate()
    );

    const days = Math.floor(
        (todayDay - enrichedDay) / (1000 * 60 * 60 * 24)
    );

    if (days > 30) return "stale";
    return "fresh";
};

  const statusConfig = {
    fresh: { label: "Fresh", color: "#22C55E", bg: "rgba(34,197,94,0.12)" },
    stale: { label: "Stale", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
    never: { label: "Never", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
  };

  const groupedCompanies: GroupedCompany[] = (() => {
    const map = new Map<string, GroupedCompany>();

    companies.forEach(c => {
      const key = c.company_website || c.company;

      if (!map.has(key)) {
        map.set(key, {
          id: c.id,                    // first lead_id → used for Sync
          company: c.company,
          company_website: c.company_website,
          tech_stack: c.tech_stack,
          enriched_at: c.enriched_at,
          industry: c.industry,
          lead_count: 1
        });
      } else {
        // Increment lead count
        const existing = map.get(key)!;
        existing.lead_count += 1;

        // Use most recent enriched_at
        if (
          c.enriched_at &&
          (!existing.enriched_at || c.enriched_at > existing.enriched_at)
        ) {
          existing.enriched_at = c.enriched_at;
          existing.tech_stack = c.tech_stack;
        }
      }
    });

    return Array.from(map.values());
  })();
  // ── Filter + search ──
  // ── Filter + search — on grouped companies ──
  const filtered = groupedCompanies.filter(c => {
    const matchSearch = !search ||
      c.company?.toLowerCase().includes(search.toLowerCase()) ||
      c.company_website?.toLowerCase().includes(search.toLowerCase());
    const status = getEnrichmentStatus(c.enriched_at);
    const matchFilter = filter === "all" || status === filter;
    return matchSearch && matchFilter;
  });
   
  // ── Stats — based on unique companies ──
  const stats = {
    total: groupedCompanies.length,
    fresh: groupedCompanies.filter(c => getEnrichmentStatus(c.enriched_at) === "fresh").length,
    stale: groupedCompanies.filter(c => getEnrichmentStatus(c.enriched_at) === "stale").length,
    never: groupedCompanies.filter(c => getEnrichmentStatus(c.enriched_at) === "never").length,
  };

  // ── Parse tech stack ──
  const parseTechStack = (raw: string | null): string[] => {
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  };

  // ── Not admin ──
  if (!isAdmin) {
    return (
      <div style={{ width: "100vw", height: "100vh", background: "#080B18", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <AlertTriangle size={28} color="#EF4444" />
          </div>
          <h2 style={{ color: "#F0F1F5", fontSize: "20px", fontWeight: 600, margin: "0 0 8px" }}>Access Denied</h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", margin: "0 0 24px" }}>You don't have admin privileges.</p>
          <button onClick={() => window.location.href = "/"} style={{ background: "#F07C2D", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 500, padding: "10px 20px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#080B18", fontFamily: "Inter, sans-serif", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      
      {/* ── Header ── */}
      <div style={{ background: "#141720", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 28px", height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "28px", height: "28px", background: "#F07C2D", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={14} color="#fff" fill="#fff" />
          </div>
          <span style={{ color: "#F0F1F5", fontSize: "16px", fontWeight: 500 }}>Outreach AI</span>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>/</span>
          <span style={{ color: "#F07C2D", fontSize: "12px", fontWeight: 500 }}>Admin Panel</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => window.location.href = "/"}
            style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "rgba(255,255,255,0.5)", fontSize: "12px", padding: "6px 14px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}
          >
            ← Back to App
          </button>
          <button
            onClick={handleRefreshAll}
            disabled={refreshingAll}
            style={{ background: refreshingAll ? "rgba(240,124,45,0.3)" : "#F07C2D", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px", fontWeight: 500, padding: "6px 14px", cursor: refreshingAll ? "not-allowed" : "pointer", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <RefreshCw size={12} style={{ animation: refreshingAll ? "spin 1s linear infinite" : "none" }} />
            {refreshingAll ? "Refreshing..." : "Refresh All Stale"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Main content ── */}
        <div style={{ flex: 1, overflow: "auto", padding: "24px 28px" }}>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
            {[
              { label: "Total Companies", value: stats.total, color: "#F0F1F5", icon: <Database size={16} color="#F07C2D" />, bg: "rgba(240,124,45,0.08)" },
              { label: "Fresh", value: stats.fresh, color: "#22C55E", icon: <CheckCircle2 size={16} color="#22C55E" />, bg: "rgba(34,197,94,0.08)" },
              { label: "Stale (30d+)", value: stats.stale, color: "#F59E0B", icon: <Clock size={16} color="#F59E0B" />, bg: "rgba(245,158,11,0.08)" },
              { label: "Never Enriched", value: stats.never, color: "#EF4444", icon: <XCircle size={16} color="#EF4444" />, bg: "rgba(239,68,68,0.08)" },
            ].map((s, i) => (
              <div key={i} style={{ background: "#0D1128", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{s.label}</span>
                  <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon}</div>
                </div>
                <p style={{ color: s.color, fontSize: "28px", fontWeight: 700, margin: 0 }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Search + Filter */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search company or website..."
              style={{ flex: 1, background: "#0D1128", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#F0F1F5", fontSize: "13px", padding: "8px 14px", outline: "none", fontFamily: "Inter, sans-serif" }}
            />
            {(["all", "fresh", "stale", "never"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ background: filter === f ? "#F07C2D" : "rgba(255,255,255,0.05)", border: "none", borderRadius: "8px", color: filter === f ? "#fff" : "rgba(255,255,255,0.4)", fontSize: "12px", fontWeight: 500, padding: "8px 14px", cursor: "pointer", fontFamily: "Inter, sans-serif", textTransform: "capitalize" }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Company Table */}
          <div style={{ background: "#0D1128", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", overflow: "hidden" }}>
            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 2fr 1fr 80px", gap: "0", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#111530" }}>
              {["Company", "Website", "Status", "Tech Stack", "Last Enriched", "Action"].map(h => (
                <span key={h} style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</span>
              ))}
            </div>

            {/* Rows */}
            {loading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>Loading companies...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>No companies found</div>
            ) : (
              filtered.map((c, i) => {
                const status = getEnrichmentStatus(c.enriched_at);
                const cfg = statusConfig[status];
                const techStack = parseTechStack(c.tech_stack).slice(0, 3);
                const isRefreshing = refreshingId === c.id;
                return (
                  <div key={c.id} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 2fr 1fr 80px", gap: "0", padding: "12px 16px", borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", alignItems: "center" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#111530"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ color: "#F0F1F5", fontSize: "13px", fontWeight: 500 }}>{c.company}</span>
                      {c.lead_count > 1 && (
                        <span style={{
                          background: "rgba(240,124,45,0.15)",
                          color: "#F07C2D",
                          fontSize: "10px",
                          fontWeight: 600,
                          padding: "1px 6px",
                          borderRadius: "10px"
                        }}>
                          {c.lead_count} leads
                        </span>
                      )}
                    </div>
                    <span style={{ color: "#F07C2D", fontSize: "12px" }}>{c.company_website || "—"}</span>
                    <span style={{ background: cfg.bg, color: cfg.color, fontSize: "11px", fontWeight: 500, padding: "3px 8px", borderRadius: "20px", display: "inline-block" }}>{cfg.label}</span>
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {techStack.length > 0 ? techStack.map(t => (
                        <span key={t} style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", fontSize: "10px", padding: "2px 6px", borderRadius: "4px" }}>{t}</span>
                      )) : <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "11px" }}>—</span>}
                    </div>
                    <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px" }}>
                      {c.enriched_at ? new Date(c.enriched_at).toLocaleDateString() : "Never"}
                    </span>
                    <button
                      onClick={() => handleRefreshSingle(c)}
                      disabled={!!refreshingId}
                      style={{ background: "rgba(240,124,45,0.1)", border: "1px solid rgba(240,124,45,0.25)", borderRadius: "6px", color: "#F07C2D", fontSize: "11px", padding: "5px 10px", cursor: refreshingId ? "not-allowed" : "pointer", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <RefreshCw size={10} style={{ animation: isRefreshing ? "spin 1s linear infinite" : "none" }} />
                      {isRefreshing ? "..." : "Sync"}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Activity Feed ── */}
        <div style={{ width: "280px", background: "#0D1128", borderLeft: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Activity size={14} color="#F07C2D" />
            <span style={{ color: "#F0F1F5", fontSize: "13px", fontWeight: 500 }}>Live Activity</span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
            {activityLog.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "12px", textAlign: "center", marginTop: "40px" }}>No activity yet</p>
            ) : (
              activityLog.map(log => (
                <div key={log.id} style={{ marginBottom: "10px", padding: "10px", background: "#141720", borderRadius: "8px", borderLeft: `3px solid ${log.status === "success" ? "#22C55E" : log.status === "failed" ? "#EF4444" : log.status === "scraping" ? "#F07C2D" : "#F59E0B"}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                    {log.status === "success" && <CheckCircle2 size={11} color="#22C55E" />}
                    {log.status === "failed" && <XCircle size={11} color="#EF4444" />}
                    {log.status === "scraping" && <RefreshCw size={11} color="#F07C2D" style={{ animation: "spin 1s linear infinite" }} />}
                    {log.status === "pending" && <Clock size={11} color="#F59E0B" />}
                    <span style={{ color: "#F0F1F5", fontSize: "12px", fontWeight: 500 }}>{log.company}</span>
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", margin: 0 }}>{log.message}</p>
                  <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "10px", margin: "3px 0 0" }}>{log.time}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}