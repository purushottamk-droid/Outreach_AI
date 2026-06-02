// import { useState, useRef, useEffect } from "react";
// import { Bell, Settings, Zap, Clock, Mail, Calendar, X as XIcon, Check } from "lucide-react";
// import { api } from "../../api";
// interface Notification {
//   id: string;
//   type: "followup" | "reply" | "meeting" | "error";
//   title: string;
//   subtitle: string;
//   time: string;
//   action: string;
//   read: boolean;
// }

// // const MOCK_NOTIFICATIONS: Notification[] = [
// //   { id: "n1", type: "followup", title: "Follow-up ready for John Doe", subtitle: "john@acme.com · 3 days no reply", time: "5 min ago", action: "Approve", read: false },
// //   { id: "n2", type: "reply", title: "Reply received from Sarah Chen", subtitle: "sarah@fintech.io · POSITIVE reply", time: "1 hr ago", action: "View", read: false },
// //   { id: "n3", type: "meeting", title: "Meeting booked — Marcus Williams", subtitle: "RevOps Demo · May 20, 2026 · 3:00 PM", time: "2 hr ago", action: "View", read: true },
// //   { id: "n4", type: "error", title: "Email failed — Priya Sharma", subtitle: "priya@lendos.ai · Delivery error", time: "3 hr ago", action: "Retry", read: true },
// // ];

// const NOTIF_ICON_CONFIG = {
//   followup: { icon: Clock, color: "#F59E0B", bg: "rgba(245,158,11,0.12)", actionBg: "#F59E0B", actionColor: "#000" },
//   reply: { icon: Mail, color: "#22C55E", bg: "rgba(34,197,94,0.12)", actionBg: "#F07C2D", actionColor: "#fff" },
//   meeting: { icon: Calendar, color: "#F07C2D", bg: "rgba(124,92,252,0.12)", actionBg: "#F07C2D", actionColor: "#fff" },
//   error: { icon: XIcon, color: "#EF4444", bg: "rgba(239,68,68,0.12)", actionBg: "rgba(239,68,68,0.15)", actionColor: "#EF4444" },
// };

// interface TopNavProps {
//   sessionActive: boolean;
//   sessionId: string | null;
//   notificationCount: number;
// }

// export function TopNav({ sessionActive, sessionId, notificationCount }: TopNavProps) {
//   const [showNotifications, setShowNotifications] = useState(false);
//   const [notifications, setNotifications] = useState<Notification[]>([]);

// useEffect(() => {
//   const uid = localStorage.getItem("user_id") || "user-001";
//   fetch(`http://localhost:8080/api/notifications/${uid}`)
//     .then(r => r.json())
//     .then((data: any[]) => {
//       const mapped = data.map(n => ({
//         id: n.notification_id,
//         type: n.type as Notification["type"],
//         title: n.title,
//         subtitle: n.subtitle,
//         time: n.time,
//         action: n.action === "approve_followup" ? "Approve" : n.action,
//         read: n.read
//       }));
//       setNotifications(mapped);
//     })
//     .catch(() => setNotifications([]));
// }, []);
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     function handleClick(e: MouseEvent) {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
//         setShowNotifications(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClick);
//     return () => document.removeEventListener("mousedown", handleClick);
//   }, []);

//   const unreadCount = notifications.filter(n => !n.read).length;

//   const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

//   return (
//     <header
//       style={{
//         height: "56px",
//         background: "#141720",
//         borderBottom: "1px solid rgba(255,255,255,0.06)",
//         fontFamily: "Inter, sans-serif",
//       }}
//       className="flex items-center justify-between px-6 shrink-0 z-10 relative"
//     >
//       {/* Left — Logo + Breadcrumb */}
//       <div className="flex items-center gap-3">
//         <div className="flex items-center gap-2">
//           <div style={{ background: "#F07C2D", borderRadius: "8px" }} className="w-7 h-7 flex items-center justify-center">
//             <Zap size={14} color="#fff" fill="#fff" />
//           </div>
//           <span style={{ color: "#F0F1F5", fontSize: "16px", fontWeight: 500 }}>Outreach AI</span>
//         </div>
//         <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }} className="flex items-center gap-1">
//           <span>Workspace</span>
//           <span>/</span>
//           <span style={{ color: "rgba(255,255,255,0.5)" }}>Active Session</span>
//         </div>
//       </div>

//       {/* Center — Session Status */}
//       <div className="flex items-center gap-2">
//         <div className="relative flex items-center">
//           {sessionActive ? (
//             <>
//               <span className="absolute inline-flex h-2 w-2 rounded-full opacity-75" style={{ background: "#22C55E", animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite" }} />
//               <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#22C55E" }} />
//             </>
//           ) : (
//             <span className="inline-flex rounded-full h-2 w-2" style={{ background: "rgba(255,255,255,0.25)" }} />
//           )}
//         </div>
//         <span
//           style={{ color: sessionActive ? "#22C55E" : "rgba(255,255,255,0.4)", fontSize: "12px", fontWeight: 400 }}
//           title="Your conversation history is being preserved across messages."
//         >
//           {sessionActive ? `Session Active${sessionId ? ` — #${sessionId}` : ""}` : "No Session"}
//         </span>
//       </div>

//       {/* Right — Icons + Avatar */}
//       <div className="flex items-center gap-2" ref={dropdownRef}>
//         {/* Bell */}
//         <button
//           className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
//           style={{ color: showNotifications ? "#F0F1F5" : "rgba(255,255,255,0.5)", background: showNotifications ? "#111530" : "transparent" }}
//           onClick={() => setShowNotifications(v => !v)}
//           onMouseEnter={e => { if (!showNotifications) (e.currentTarget as HTMLElement).style.background = "#111530"; }}
//           onMouseLeave={e => { if (!showNotifications) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
//         >
//           <Bell size={16} />
//           {unreadCount > 0 && (
//             <span
//               className="absolute top-0 right-0 w-4 h-4 flex items-center justify-center rounded-full"
//               style={{ background: "#F07C2D", fontSize: "9px", color: "#fff", fontWeight: 600, animation: unreadCount > notificationCount ? "badge-pop 0.3s ease" : "none" }}
//             >
//               {unreadCount}
//             </span>
//           )}
//         </button>

//         {/* Notification Dropdown */}
//         {showNotifications && (
//           <div
//             style={{
//               position: "absolute",
//               top: "52px",
//               right: "72px",
//               width: "340px",
//               background: "#141720",
//               border: "1px solid rgba(255,255,255,0.08)",
//               borderRadius: "12px",
//               boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
//               zIndex: 200,
//               overflow: "hidden",
//               animation: "dropDown 0.18s ease-out",
//             }}
//           >
//             {/* Header */}
//             <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
//               <span style={{ color: "#F0F1F5", fontSize: "14px", fontWeight: 500 }}>Notifications</span>
//               {unreadCount > 0 && (
//                 <button
//                   onClick={markAllRead}
//                   style={{ background: "none", border: "none", cursor: "pointer", color: "#F07C2D", fontSize: "12px", fontFamily: "Inter, sans-serif" }}
//                 >
//                   Mark all read
//                 </button>
//               )}
//             </div>

//             {/* Items */}
//             {notifications.length === 0 ? (
//               <div style={{ padding: "32px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
//                 <Bell size={24} color="rgba(255,255,255,0.2)" />
//                 <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>All caught up</p>
//               </div>
//             ) : (
//               <div>
//                 {notifications.map((notif, i) => {
//                   const cfg = NOTIF_ICON_CONFIG[notif.type];
//                   const Icon = cfg.icon;
//                   return (
//                     <div
//                       key={notif.id}
//                       style={{
//                         padding: "12px 16px",
//                         borderBottom: i < notifications.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
//                         display: "flex",
//                         alignItems: "center",
//                         gap: "10px",
//                         background: notif.read ? "transparent" : "rgba(124,92,252,0.03)",
//                         transition: "background 0.15s",
//                         cursor: "pointer",
//                       }}
//                       onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#111530")}
//                       onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = notif.read ? "transparent" : "rgba(124,92,252,0.03)")}
//                     >
//                       {/* Icon */}
//                       <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
//                         <Icon size={16} color={cfg.color} />
//                       </div>
//                       {/* Content */}
//                       <div style={{ flex: 1, minWidth: 0 }}>
//                         <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
//                           <p style={{ color: "#F0F1F5", fontSize: "13px", fontWeight: notif.read ? 400 : 500, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
//                             {notif.title}
//                           </p>
//                           {!notif.read && <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#F07C2D", flexShrink: 0 }} />}
//                         </div>
//                         <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
//                           {notif.subtitle}
//                         </p>
//                         <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "10px", margin: "2px 0 0" }}>{notif.time}</p>
//                       </div>
//                       {/* Action */}
//                       <button
//                         onClick={async e => {
//                           e.stopPropagation();
//                           if (notif.action === "approve_followup") {
//                             const uid = localStorage.getItem("user_id") || "user-001";
//                             try {
//                               await fetch(`http://localhost:8080/api/approvals/${notif.id}/approve`, {
//                                 method: "POST",
//                                 headers: { "Content-Type": "application/json" },
//                                 body: JSON.stringify({ approval_id: notif.id, user_id: uid })
//                               });
//                             } catch {}
//                           }
//                           setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
//                         }}
//                         style={{
//                           background: cfg.actionBg,
//                           border: "none",
//                           borderRadius: "6px",
//                           color: cfg.actionColor,
//                           fontSize: "11px",
//                           fontWeight: 500,
//                           padding: "4px 10px",
//                           height: "28px",
//                           cursor: "pointer",
//                           flexShrink: 0,
//                           fontFamily: "Inter, sans-serif",
//                         }}
//                       >
//                         {notif.action}
//                       </button>
//                     </div>
//                   );
//                 })}
//               </div>
//             )}
//           </div>
//         )}

//         <button
//           className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
//           style={{ color: "rgba(255,255,255,0.5)" }}
//           onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#111530")}
//           onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}
//         >
//           <Settings size={16} />
//         </button>
//         <div
//           className="w-8 h-8 rounded-full flex items-center justify-center ml-1"
//           style={{ background: "#111530", boxShadow: "0 0 0 2px #F07C2D", color: "#F0F1F5", fontSize: "12px", fontWeight: 600 }}
//         >
//           JD
//         </div>
//       </div>

//       <style>{`
//         @keyframes ping {
//           75%, 100% { transform: scale(2); opacity: 0; }
//         }
//         @keyframes dropDown {
//           from { opacity: 0; transform: translateY(-6px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
//         @keyframes badge-pop {
//           0% { transform: scale(1); }
//           50% { transform: scale(1.3); }
//           100% { transform: scale(1); }
//         }
//       `}</style>
//     </header>
//   );
// }

import { useState, useRef, useEffect } from "react";
import { Bell, Settings, Zap, X, Check, ChevronDown, ChevronUp, Mail, Calendar, Clock, RefreshCw, Eye, Send } from "lucide-react";

interface Notification {
  id: string;
  type: "followup" | "reply" | "meeting" | "error";
  title: string;
  subtitle: string;
  time: string;
  action: string;
  read: boolean;
  email_body?: string;
  email_subject?: string;
  lead_email?: string;
  lead_name?: string;
  meeting_date?: string;
  duration?: number;
}

interface TopNavProps {
  sessionActive: boolean;
  sessionId: string | null;
  notificationCount: number;
}

export function TopNav({ sessionActive, sessionId, notificationCount }: TopNavProps) {
  const [showPanel, setShowPanel] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [expandedReply, setExpandedReply] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [refineId, setRefineId] = useState<string | null>(null);
  const [refineText, setRefineText] = useState("");
  const [refining, setRefining] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);
  const [booking, setBooking] = useState<string | null>(null);

  const uid = localStorage.getItem("user_id") || "user-001";

  const fetchNotifications = () => {
    fetch(`http://localhost:8080/api/notifications/${uid}`)
      .then(r => r.json())
      .then((data: any[]) => {
        const mapped = data.map(n => ({
          id: n.notification_id,
          type: n.type as Notification["type"],
          title: n.title,
          subtitle: n.subtitle,
          time: n.time,
          action: n.action,
          read: n.read,
          email_body: n.email_body,
          email_subject: n.email_subject,
          lead_email: n.lead_email,
          lead_name: n.lead_name,
          meeting_date: n.meeting_date,
          duration: n.duration
        }));
        setNotifications(mapped);
      })
      .catch(() => setNotifications([]));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const markAllSeen = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };
  const handleApprove = async (notif: Notification) => {
    setApproving(notif.id);
    try {
      await fetch(`http://localhost:8080/api/approvals/${notif.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approval_id: notif.id, user_id: uid })
      });
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
    } catch {}
    setApproving(null);
  };

  const handleDecline = async (notif: Notification) => {
    try {
      await fetch(`http://localhost:8080/api/approvals/${notif.id}/skip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approval_id: notif.id, user_id: uid })
      });
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
    } catch {}
  };

  const handleRefine = async (notif: Notification) => {
    if (!refineText.trim()) return;
    setRefining(true);
    try {
      const res = await fetch(`http://localhost:8080/api/approvals/${notif.id}/refine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approval_id: notif.id,
          user_id: uid,
          instruction: refineText
        })
      });
      const data = await res.json();
      setNotifications(prev => prev.map(n =>
        n.id === notif.id
          ? { ...n, email_body: data.email_body, email_subject: data.email_subject }
          : n
      ));
      setRefineText("");
      setRefineId(null);
    } catch {}
    setRefining(false);
  };

  const handleBookMeeting = async (notif: Notification) => {
    setBooking(notif.id);
    try {
      await fetch(`http://localhost:8080/api/approvals/${notif.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approval_id: notif.id, user_id: uid })
      });
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
    } catch {}
    setBooking(null);
  };

  const getIcon = (type: string) => {
    if (type === "reply") return <Mail size={16} color="#22C55E" />;
    if (type === "meeting") return <Calendar size={16} color="#F07C2D" />;
    return <Clock size={16} color="#F59E0B" />;
  };

  const getIconBg = (type: string) => {
    if (type === "reply") return "rgba(34,197,94,0.12)";
    if (type === "meeting") return "rgba(240,124,45,0.12)";
    return "rgba(245,158,11,0.12)";
  };

  return (
    <>
      <header
        style={{
          height: "56px",
          background: "#141720",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          fontFamily: "Inter, sans-serif",
        }}
        className="flex items-center justify-between px-6 shrink-0 z-10 relative"
      >
        {/* Left */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div style={{ background: "#F07C2D", borderRadius: "8px" }} className="w-7 h-7 flex items-center justify-center">
              <Zap size={14} color="#fff" fill="#fff" />
            </div>
            <span style={{ color: "#F0F1F5", fontSize: "16px", fontWeight: 500 }}>Outreach AI</span>
          </div>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }} className="flex items-center gap-1">
            <span>Workspace</span>
            <span>/</span>
            <span style={{ color: "rgba(255,255,255,0.5)" }}>Active Session</span>
          </div>
        </div>

        {/* Center */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            {sessionActive ? (
              <>
                <span className="absolute inline-flex h-2 w-2 rounded-full opacity-75" style={{ background: "#22C55E", animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite" }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#22C55E" }} />
              </>
            ) : (
              <span className="inline-flex rounded-full h-2 w-2" style={{ background: "rgba(255,255,255,0.25)" }} />
            )}
          </div>
          <span style={{ color: sessionActive ? "#22C55E" : "rgba(255,255,255,0.4)", fontSize: "12px", fontWeight: 400 }}>
            {sessionActive ? `Session Active${sessionId ? ` — #${sessionId}` : ""}` : "No Session"}
          </span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">

          {/* Atgeir Logo */}
          <img
            src="/atgeir-logo.svg"
            alt="Atgeir"
            style={{
              height: "28px",
              width: "auto",
              objectFit: "contain"
            }}
          />          
          <button
            className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: showPanel ? "#F0F1F5" : "rgba(255,255,255,0.5)", background: showPanel ? "#111530" : "transparent" }}
            onClick={() => { setShowPanel(v => !v); fetchNotifications(); markAllSeen(); }}
            onMouseEnter={e => { if (!showPanel) (e.currentTarget as HTMLElement).style.background = "#111530"; }}
            onMouseLeave={e => { if (!showPanel) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
          
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 flex items-center justify-center rounded-full"
                style={{ background: "#F07C2D", fontSize: "9px", color: "#fff", fontWeight: 600 }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* <button
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: "rgba(255,255,255,0.5)" }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#111530")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}
          >
            <Settings size={16} />
          </button> */}

          <div
            className="w-8 h-8 rounded-full flex items-center justify-center ml-1"
            style={{ background: "#111530", boxShadow: "0 0 0 2px #F07C2D", color: "#F0F1F5", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
            title="Click to logout"
            onClick={() => {
              localStorage.clear();
              window.location.href = "/";
            }}
          >
            JD
          </div>
        </div>
      </header>

      {/* Overlay */}
      {showPanel && (
        <div
          onClick={() => setShowPanel(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 40 }}
        />
      )}

      {/* Slide-in Notification Panel */}
      <div style={{
        position: "fixed",
        top: 0,
        right: showPanel ? 0 : "-440px",
        width: "420px",
        height: "100vh",
        background: "#080B18",
        borderLeft: "1px solid rgba(255,255,255,0.08)",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        transition: "right 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        fontFamily: "Inter, sans-serif",
      }}>
        {/* Panel Header */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h2 style={{ color: "#F0F1F5", fontSize: "18px", fontWeight: 600, margin: 0 }}>Notifications</h2>
            {unreadCount > 0 && (
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: "2px 0 0" }}>{unreadCount} requiring action</p>
            )}
          </div>
          <button
            onClick={() => setShowPanel(false)}
            style={{ background: "#111530", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.5)" }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Notifications List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
          {notifications.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0", gap: "12px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Bell size={20} color="rgba(255,255,255,0.2)" />
              </div>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>All caught up</p>
              <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "12px", textAlign: "center", maxWidth: "240px" }}>No pending notifications. Replies and approvals will appear here.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {notifications.map(notif => (
                <div key={notif.id} style={{
                  background: notif.read ? "#141720" : "rgba(124,92,252,0.05)",
                  border: `1px solid ${notif.read ? "rgba(255,255,255,0.06)" : "rgba(124,92,252,0.2)"}`,
                  borderRadius: "12px",
                  overflow: "hidden"
                }}>
                  {/* Notification Header */}
                  <div style={{ padding: "14px 14px 10px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: getIconBg(notif.type), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {getIcon(notif.type)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                        <p style={{ color: "#F0F1F5", fontSize: "13px", fontWeight: 500, margin: 0 }}>{notif.title}</p>
                        {!notif.read && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#F07C2D", flexShrink: 0 }} />}
                      </div>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: 0 }}>{notif.subtitle}</p>
                      <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "11px", margin: "3px 0 0" }}>{notif.time}</p>
                    </div>
                  </div>

                  {/* Reply type — show reply preview with expand */}
                  {notif.type === "reply" && notif.email_body && (
                    <div style={{ margin: "0 14px 10px", background: "#111530", borderRadius: "8px", overflow: "hidden" }}>
                      <div style={{ padding: "10px 12px" }}>
                        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "12px", lineHeight: 1.6, margin: 0,
                          overflow: expandedReply === notif.id ? "visible" : "hidden",
                          display: expandedReply === notif.id ? "block" : "-webkit-box",
                          WebkitLineClamp: expandedReply === notif.id ? undefined : 2,
                          WebkitBoxOrient: "vertical" as const
                        }}>
                          {notif.email_body}
                        </p>
                      </div>
                      <button
                        onClick={() => setExpandedReply(expandedReply === notif.id ? null : notif.id)}
                        style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "none", borderTop: "1px solid rgba(255,255,255,0.05)", color: "#F07C2D", fontSize: "11px", padding: "6px", cursor: "pointer", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                      >
                        {expandedReply === notif.id ? <><ChevronUp size={11} /> Show less</> : <><ChevronDown size={11} /> View full reply</>}
                      </button>
                    </div>
                  )}
                  {notif.type === "reply" && (
                    <div style={{ margin: "0 14px 10px", display: "flex", justifyContent: "flex-end" }}>
                      <button
                        onClick={() => handleDecline(notif)}
                        style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "rgba(255,255,255,0.4)", fontSize: "11px", padding: "4px 10px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                  
                  

                  {/* Followup type — email approval with preview/refine/approve/decline */}
                  {notif.type === "followup" && notif.action === "approve_followup" && (
                    <div style={{ margin: "0 14px 12px" }}>
                      {/* Email Preview */}
                      {showPreview === notif.id && (
                        <div style={{ background: "#1A1E2E", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "12px", marginBottom: "8px" }}>
                          {notif.email_subject && (
                            <>
                              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Subject</p>
                              <p style={{ color: "#F0F1F5", fontSize: "13px", fontWeight: 500, margin: "0 0 10px" }}>{notif.email_subject}</p>
                            </>
                          )}
                          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Body</p>
                          <p style={{ color: "#C8CAD4", fontSize: "12px", lineHeight: 1.7, whiteSpace: "pre-wrap", margin: 0 }}>
                            {notif.email_body || "No content available"}
                          </p>
                        </div>
                      )}

                      {/* Refine Input */}
                      {refineId === notif.id && (
                        <div style={{ marginBottom: "8px" }}>
                          <input
                            value={refineText}
                            onChange={e => setRefineText(e.target.value)}
                            placeholder="e.g. Make it shorter, more casual tone..."
                            style={{ width: "100%", background: "#111530", border: "1px solid rgba(124,92,252,0.4)", borderRadius: "8px", color: "#F0F1F5", fontSize: "12px", padding: "8px 12px", outline: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box" }}
                          />
                          <button
                            onClick={() => handleRefine(notif)}
                            disabled={refining || !refineText.trim()}
                            style={{ marginTop: "6px", width: "100%", background: refining ? "rgba(240,124,45,0.3)" : "#F07C2D", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px", fontWeight: 500, padding: "7px", cursor: refining ? "not-allowed" : "pointer", fontFamily: "Inter, sans-serif" }}
                          >
                            {refining ? "Regenerating..." : "Regenerate Email"}
                          </button>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <button
                          onClick={() => setShowPreview(showPreview === notif.id ? null : notif.id)}
                          style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "6px", color: "rgba(255,255,255,0.6)", fontSize: "11px", padding: "5px 10px", cursor: "pointer", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: "4px" }}
                        >
                          <Eye size={11} /> {showPreview === notif.id ? "Hide" : "Preview"}
                        </button>
                        <button
                          onClick={() => { setRefineId(refineId === notif.id ? null : notif.id); setRefineText(""); }}
                          style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "6px", color: "rgba(255,255,255,0.6)", fontSize: "11px", padding: "5px 10px", cursor: "pointer", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: "4px" }}
                        >
                          <RefreshCw size={11} /> Refine
                        </button>
                        <button
                          onClick={() => handleApprove(notif)}
                          disabled={approving === notif.id}
                          style={{ background: "#22C55E", border: "none", borderRadius: "6px", color: "#fff", fontSize: "11px", fontWeight: 600, padding: "5px 12px", cursor: "pointer", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: "4px" }}
                        >
                          <Send size={11} /> {approving === notif.id ? "Sending..." : "Approve"}
                        </button>
                        <button
                          onClick={() => handleDecline(notif)}
                          style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", color: "#EF4444", fontSize: "11px", padding: "5px 10px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  )}

                  
                  {/* Meeting type — book meeting button */}
                  {notif.type === "meeting" && (
                    <div style={{ margin: "0 14px 12px" }}>
                      {notif.meeting_date && (
                        <div style={{ background: "#111530", borderRadius: "8px", padding: "10px 12px", marginBottom: "8px" }}>
                          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", marginBottom: "4px" }}>Proposed time</p>
                          <p style={{ color: "#F0F1F5", fontSize: "13px", fontWeight: 500 }}>{notif.meeting_date}</p>
                          {notif.duration && <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", marginTop: "2px" }}>{notif.duration} minutes</p>}
                        </div>
                      )}
                      {showPreview === notif.id && notif.email_body && (
                        <div style={{ background: "#1A1E2E", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "12px", marginBottom: "8px" }}>
                          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Confirmation Email</p>
                          <p style={{ color: "#C8CAD4", fontSize: "12px", lineHeight: 1.7, whiteSpace: "pre-wrap", margin: 0 }}>
                            {(() => {
                              try {
                                const parsed = JSON.parse(notif.email_body);
                                return parsed.confirmation_body || notif.email_body;
                              } catch {
                                return notif.email_body;
                              }
                            })()}
                          </p>
                        </div>
                      )}
                      <button
                        onClick={() => setShowPreview(showPreview === notif.id ? null : notif.id)}
                        style={{ width: "100%", background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "6px", color: "rgba(255,255,255,0.6)", fontSize: "11px", padding: "6px", cursor: "pointer", fontFamily: "Inter, sans-serif", marginBottom: "6px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                      >
                        <Eye size={11} /> {showPreview === notif.id ? "Hide Email" : "Preview Confirmation Email"}
                      </button>
                      <button
                        onClick={() => handleBookMeeting(notif)}
                        disabled={booking === notif.id}
                        style={{ width: "100%", background: booking === notif.id ? "rgba(240,124,45,0.3)" : "#F07C2D", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 500, padding: "10px", cursor: booking === notif.id ? "not-allowed" : "pointer", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                      >
                        <Calendar size={14} /> {booking === notif.id ? "Booking..." : "Book Meeting & Send Confirmation"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
      `}</style>
    </>
  );
}