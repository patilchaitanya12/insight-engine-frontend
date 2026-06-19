import { useSignIn } from "@clerk/clerk-react";
import { BarChart2 } from "lucide-react";
import { useState } from "react";

export default function SignInPage() {
  const { signIn, isLoaded } = useSignIn();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError(null);
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (err: any) {
      setError(err?.errors?.[0]?.message || "Sign in failed. Try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .signin-wrap {
          animation: fadeIn 0.35s ease forwards;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .spin { animation: spin 0.8s linear infinite; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-base)",
        padding: "24px",
      }}>
        <div className="signin-wrap" style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 32,
          width: "100%",
          maxWidth: 360,
        }}>

          {/* Logo */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 24px rgba(13,148,136,0.3)",
            }}>
              <BarChart2 size={22} color="white" />
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{
                fontSize: 20, fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
                margin: "0 0 4px",
              }}>
                Insight Engine
              </p>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
                AI-powered analytics
              </p>
            </div>
          </div>

          {/* Card */}
          <div style={{
            width: "100%",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 16,
            padding: "28px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}>
            <div style={{ textAlign: "center", marginBottom: 4 }}>
              <p style={{
                fontSize: 15, fontWeight: 600,
                color: "var(--text-primary)", margin: "0 0 6px",
              }}>
                Welcome
              </p>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
                Sign in to save your datasets and query history
              </p>
            </div>

            {/* Google button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading || !isLoaded}
              style={{
                width: "100%",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "11px 0",
                borderRadius: 10,
                fontSize: 14, fontWeight: 600,
                color: "var(--text-primary)",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-muted)",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "border-color 0.15s, background 0.15s",
                opacity: loading ? 0.7 : 1,
              }}
              onMouseEnter={e => {
                if (!loading) {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
                  (e.currentTarget as HTMLElement).style.background = "var(--accent-bg)";
                }
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-muted)";
                (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)";
              }}
            >
              {loading ? (
                <svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
              ) : (
                /* Google SVG icon */
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              {loading ? "Signing in..." : "Continue with Google"}
            </button>

            {/* Error */}
            {error && (
              <p style={{
                fontSize: 12, color: "#f87171",
                textAlign: "center", margin: 0,
              }}>
                {error}
              </p>
            )}

            {/* Fine print */}
            <p style={{
              fontSize: 11, color: "var(--text-muted)",
              textAlign: "center", margin: 0, lineHeight: 1.5,
            }}>
              By continuing, you agree to our terms.
              Your data is private and never shared.
            </p>
          </div>

        </div>
      </div>
    </>
  );
}