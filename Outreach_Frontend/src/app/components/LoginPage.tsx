import { useEffect, useState } from "react";
import { Zap, Search, MessageSquare, Calendar, ArrowRight } from "lucide-react";

interface LoginPageProps {
  onLogin: (userId: string, accessToken: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [loading, setLoading] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Handle OAuth redirect callback
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("user_id");
    const accessToken = params.get("access_token");

    if (userId && accessToken) {
      localStorage.setItem("user_id", userId);
      onLogin(userId, accessToken);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [onLogin]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/auth/google");
      const data = await res.json();
      if (data.auth_url) {
        window.location.href = data.auth_url;
      }
    } catch (e) {
      console.error("Auth failed", e);
      setLoading(false);
    }
  };

  // const features = [
  //   {
  //     icon: Search,
  //     color: "#A78BFA",
  //     bg: "rgba(240,124,45,0.1)",
  //     title: "AI-powered lead outreach",
  //     desc: "Finds and contacts leads automatically based on your ICP",
  //   },
  //   {
  //     icon: MessageSquare,
  //     color: "#34D399",
  //     bg: "rgba(52,211,153,0.1)",
  //     title: "Smart reply detection",
  //     desc: "Classifies replies and drafts contextual responses instantly",
  //   },
  //   {
  //     icon: Calendar,
  //     color: "#60A5FA",
  //     bg: "rgba(96,165,250,0.1)",
  //     title: "One-click meeting booking",
  //     desc: "Books Google Meet automatically when leads are ready to talk",
  //   },
  // ];
  const features = [
  {
    icon: Search,
    color: "#F07C2D",
    bg: "rgba(240,124,45,0.1)",
    title: "AI-powered lead outreach",
    desc: "Finds and contacts leads automatically based on your ICP",
  },
  {
    icon: MessageSquare,
    color: "#F07C2D",
    bg: "rgba(240,124,45,0.08)",
    title: "Smart reply detection",
    desc: "Classifies replies and drafts contextual responses instantly",
  },
  {
    icon: Calendar,
    color: "#F07C2D",
    bg: "rgba(240,124,45,0.08)",
    title: "One-click meeting booking",
    desc: "Books Google Meet automatically when leads are ready to talk",
  },
];

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#080B18",
        display: "flex",
        fontFamily: "Inter, sans-serif",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Background grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(rgba(240,124,45,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(240,124,45,0.02) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
          pointerEvents: "none",
        }}
      />

      {/* Ambient glow top-left */}
      <div
        style={{
          position: "absolute",
          top: "-120px",
          left: "-80px",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(29,25,75,0.4) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Ambient glow bottom-right */}
      <div
        style={{
          position: "absolute",
          bottom: "-100px",
          right: "-100px",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      {/* Top-right logo */}
      <div style={{
        position: "absolute",
        top: "24px",
        right: "32px",
        zIndex: 10,
      }}>
        <img
          src="/atgeir-logo.svg"
          alt="Atgeir Solutions"
          style={{
            height: "36px",
            width: "auto",
            objectFit: "contain",
          }}
        />
      </div>

      {/* ─── LEFT PANEL ─────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 64px",
          position: "relative",
          zIndex: 1,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "64px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              background: "#F07C2D",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 20px rgba(240,124,45,0.4)",
            }}
          >
            <Zap size={18} color="#fff" fill="#fff" />
          </div>
          <span
            style={{
              color: "#F0F1F5",
              fontSize: "18px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            Outreach AI
          </span>
        </div>

        {/* Headline */}
        <div style={{ marginBottom: "48px" }}>
          <h1
            style={{
              color: "#F0F1F5",
              fontSize: "42px",
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              margin: "0 0 16px",
              maxWidth: "440px",
            }}
          >
            Close more deals with{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #A78BFA, #F07C2D)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              AI outreach
            </span>
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: "16px",
              lineHeight: 1.65,
              margin: 0,
              maxWidth: "380px",
            }}
          >
            Your AI sales agent that finds leads, crafts personalized emails,
            and books meetings — fully automated.
          </p>
        </div>

        {/* Feature list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "14px",
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateX(0)" : "translateX(-12px)",
                  transition: `opacity 0.5s ease ${0.1 + i * 0.1}s, transform 0.5s ease ${0.1 + i * 0.1}s`,
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: f.bg,
                    border: `1px solid ${f.color}22`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: "2px",
                  }}
                >
                  <Icon size={16} color={f.color} />
                </div>
                <div>
                  <p
                    style={{
                      color: "#E4E6EC",
                      fontSize: "14px",
                      fontWeight: 500,
                      margin: "0 0 3px",
                    }}
                  >
                    {f.title}
                  </p>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.38)",
                      fontSize: "13px",
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    {f.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom badge */}
        <div
          style={{
            marginTop: "56px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: "20px",
              padding: "5px 12px",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#22C55E",
                display: "inline-block",
                animation: "pulse 2s ease-in-out infinite",
              }}
            />
            <span
              style={{
                color: "#22C55E",
                fontSize: "12px",
                fontWeight: 500,
              }}
            >
              System operational
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          width: "1px",
          background:
            "linear-gradient(to bottom, transparent, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.06) 80%, transparent)",
          margin: "40px 0",
          flexShrink: 0,
        }}
      />

      {/* ─── RIGHT PANEL ─────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 64px",
          position: "relative",
          zIndex: 1,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.6s ease 0.15s, transform 0.6s ease 0.15s",
        }}
      >
        <div style={{ width: "100%", maxWidth: "380px" }}>
          {/* Card */}
          <div
            style={{
              background: "#0D1128",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "20px",
              padding: "40px",
              boxShadow:
                "0 0 0 1px rgba(124,92,252,0.05), 0 24px 60px rgba(0,0,0,0.4)",
            }}
          >
            {/* Card header */}
            <div style={{ marginBottom: "32px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  background: "rgba(29,25,75,0.4)",
                  border: "1px solid rgba(240,124,45,0.25)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px",
                }}
              >
                <Zap size={20} color="#F07C2D" />
              </div>
              <h2
                style={{
                  color: "#F0F1F5",
                  fontSize: "24px",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  margin: "0 0 8px",
                }}
              >
                Welcome back
              </h2>
              <p
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: "14px",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                Sign in to your workspace to continue
              </p>
            </div>

            {/* Google button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
              style={{
                width: "100%",
                height: "48px",
                background: hovering
                  ? "rgba(255,255,255,0.07)"
                  : "rgba(255,255,255,0.04)",
                border: hovering
                  ? "1px solid rgba(255,255,255,0.18)"
                  : "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                color: "#F0F1F5",
                fontSize: "14px",
                fontWeight: 500,
                fontFamily: "Inter, sans-serif",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0px",
                padding: "0 16px",
                transition: "all 0.18s ease",
                opacity: loading ? 0.6 : 1,
                boxShadow: hovering
                  ? "0 0 0 1px rgba(240,124,45,0.2), 0 4px 16px rgba(0,0,0,0.2)"
                  : "none",
              }}
            >
              {loading ? (
  <>
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid rgba(255,255,255,0.2)",
                      borderTopColor: "#7C5CFC",
                      borderRadius: "50%",
                      animation: "spin 0.7s linear infinite",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1, textAlign: "center" }}>Redirecting...</span>
                </>
              ) : (
                <>
                  {/* Google G — fixed left */}
                  <div style={{ width: "20px", height: "20px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                    </svg>
                  </div>

                  {/* Centered text */}
                  <span style={{
                    flex: 1,
                    textAlign: "center",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#F0F1F5",
                    letterSpacing: "-0.01em"
                  }}>
                    Continue with Google
                  </span>

                  {/* Arrow — fixed right */}
                  <div style={{ width: "20px", height: "20px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ArrowRight size={14} color="rgba(255,255,255,0.3)" />
                  </div>
                </>
              )}
            </button>

            {/* Divider */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                margin: "24px 0",
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: "1px",
                  background: "rgba(255,255,255,0.06)",
                }}
              />
              <span
                style={{ color: "rgba(255,255,255,0.2)", fontSize: "11px" }}
              >
                SECURE LOGIN
              </span>
              <div
                style={{
                  flex: 1,
                  height: "1px",
                  background: "rgba(255,255,255,0.06)",
                }}
              />
            </div>

            {/* Security badges */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "20px",
                marginBottom: "24px",
              }}
            >
              {["OAuth 2.0", "256-bit SSL", "SOC 2"].map((badge) => (
                <div
                  key={badge}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <div
                    style={{
                      width: "4px",
                      height: "4px",
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.2)",
                    }}
                  />
                  <span
                    style={{
                      color: "rgba(255,255,255,0.25)",
                      fontSize: "11px",
                      fontWeight: 500,
                    }}
                  >
                    {badge}
                  </span>
                </div>
              ))}
            </div>

            {/* Terms */}
            <p
              style={{
                color: "rgba(255,255,255,0.22)",
                fontSize: "12px",
                textAlign: "center",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              By signing in, you agree to our{" "}
              <span
                style={{
                  color: "rgba(240,124,45,0.7)",
                  cursor: "pointer",
                  textDecoration: "underline",
                  textDecorationColor: "rgba(240,124,45,0.3)",
                }}
              >
                Terms of Service
              </span>
            </p>
          </div>

          {/* Below card note */}
          <p
            style={{
              color: "rgba(255,255,255,0.2)",
              fontSize: "12px",
              textAlign: "center",
              marginTop: "20px",
            }}
          >
            New to Outreach AI? Your account is created automatically on first
            sign in.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}