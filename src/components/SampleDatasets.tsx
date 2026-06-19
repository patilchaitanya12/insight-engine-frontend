import { useState, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { ChevronDown, ChevronUp, CheckCircle2, AlertCircle } from "lucide-react";

interface Props {
  onSuccess: (datasetId: string, suggestions: string[]) => void;
}

interface LogLine {
  id: number;
  icon: string;
  message: string;
  detail?: string;
  status: "running" | "done" | "warn";
}

const SAMPLES = [
  { key: "household",  icon: "🏠", label: "Household Expenses",   desc: "12 months · family spending"    },
  { key: "investment", icon: "📈", label: "Investment Portfolio",  desc: "24 months · 8 assets"           },
  { key: "retail",     icon: "🛍️", label: "Retail Sales",          desc: "18 months · 10 products"        },
  { key: "hr",         icon: "👥", label: "HR Analytics",          desc: "200 employees · 6 depts"        },
  { key: "health",     icon: "🏃", label: "Health & Fitness",      desc: "180 days · daily tracker"       },
  { key: "restaurant", icon: "🍽️", label: "Restaurant Analytics",  desc: "90 days · 10 dishes"            },
];

export default function SampleDatasets({ onSuccess }: Props) {
  const [expanded, setExpanded]     = useState(false);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [logs, setLogs]             = useState<LogLine[]>([]);
  const [error, setError]           = useState<string | null>(null);
  const logIdRef                    = useRef(0);
  const esRef                       = useRef<EventSource | null>(null);

  // Clerk token — same pattern as your other authenticated calls
  const { getToken } = useAuth();

  const addLog = (icon: string, message: string, detail = "", status: LogLine["status"] = "done") => {
    const id = ++logIdRef.current;
    setLogs(prev => [...prev, { id, icon, message, detail, status }]);
  };

  const handleLoad = async (key: string) => {
    if (loadingKey) return;
    setLoadingKey(key);
    setLogs([]);
    setError(null);

    const baseUrl = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

    // ── Phase 1: authenticated REST call to get a job_id ──────────────────
    // EventSource can't send headers, so we use fetch() here with the Bearer
    // token, then hand off to EventSource using the returned job_id.
    let job_id: string;
    try {
      const token = await getToken();
      const res = await fetch(`${baseUrl}/datasets/sample/${key}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail || `Request failed (${res.status})`);
      }

      const data = await res.json();
      job_id = data.job_id;
    } catch (err: any) {
      setError(err?.message || "Failed to start loading. Please try again.");
      setLoadingKey(null);
      return;
    }

    // ── Phase 2: open EventSource on the unauthenticated stream route ─────
    // The backend retrieves user_id from the job store created in Phase 1.
    const es = new EventSource(`${baseUrl}/datasets/sample/stream/${job_id}`);
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "progress") {
          const isCheck = data.icon === "✓";
          const isWarn  = data.icon === "⚠️";
          addLog(
            data.icon,
            data.message,
            data.detail || "",
            isCheck ? "done" : isWarn ? "warn" : "running"
          );
        }

        if (data.type === "done") {
          addLog("✓", "All done! Opening your dashboard...", "", "done");
          es.close();
          esRef.current = null;
          setTimeout(() => {
            onSuccess(data.dataset_id, data.suggested_questions || []);
            setLoadingKey(null);
            setLogs([]);
          }, 600);
        }

        if (data.type === "error") {
          setError(data.message);
          setLoadingKey(null);
          setLogs([]);
          es.close();
          esRef.current = null;
        }
      } catch { /* ignore malformed events */ }
    };

    es.onerror = () => {
      setError("Connection lost. Please try again.");
      setLoadingKey(null);
      setLogs([]);
      es.close();
      esRef.current = null;
    };
  };

  const handleCancel = () => {
    esRef.current?.close();
    esRef.current = null;
    setLoadingKey(null);
    setLogs([]);
    setError(null);
  };

  const activeDataset = SAMPLES.find(s => s.key === loadingKey);

  return (
    <>
      <style>{`
        @keyframes expandDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .log-line { animation: fadeSlideIn 0.25s ease forwards; }
        .spinner  { display: inline-block; animation: spin 0.8s linear infinite; }
        .samples-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 12px;
        }
        .sample-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          padding: 14px;
          cursor: pointer;
          transition: border-color 0.15s, transform 0.15s;
          text-align: left;
          width: 100%;
        }
        .sample-card:hover:not(:disabled) {
          border-color: var(--accent);
          transform: translateY(-2px);
        }
        .sample-card:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
        .sample-card.active-card {
          border-color: var(--accent) !important;
          background: var(--accent-bg) !important;
        }
        @media (max-width: 600px) {
          .samples-grid {
            display: flex;
            flex-direction: row;
            overflow-x: auto;
            gap: 10px;
            padding-bottom: 6px;
            scrollbar-width: none;
            -ms-overflow-style: none;
            grid-template-columns: unset;
          }
          .samples-grid::-webkit-scrollbar { display: none; }
          .sample-card { flex-shrink: 0; width: 148px; }
        }
        @media (min-width: 601px) and (max-width: 860px) {
          .samples-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: 480 }}>

        {/* ── Toggle button ── */}
        <button
          onClick={() => { setExpanded(p => !p); setError(null); }}
          disabled={!!loadingKey}
          style={{
            width: "100%",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            fontSize: 13, fontWeight: 500,
            color: "var(--text-secondary)",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 10, padding: "10px 0",
            cursor: loadingKey ? "not-allowed" : "pointer",
            transition: "border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={e => {
            if (!loadingKey) {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
              (e.currentTarget as HTMLElement).style.color = "var(--accent-light)";
            }
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
            (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
          }}
        >
          {expanded
            ? <><ChevronUp size={14} /> Hide sample datasets</>
            : <><ChevronDown size={14} /> Try a sample dataset</>
          }
        </button>

        {/* ── Expanded section ── */}
        {expanded && (
          <div style={{ animation: "expandDown 0.25s ease forwards" }}>

            {/* ── SSE log panel — shown while loading ── */}
            {loadingKey && logs.length > 0 && (
              <div style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 12,
                padding: "14px 16px",
                marginTop: 12,
              }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  marginBottom: 10,
                  paddingBottom: 10,
                  borderBottom: "1px solid var(--border-subtle)",
                }}>
                  <span style={{ fontSize: 16 }}>{activeDataset?.icon}</span>
                  <p style={{
                    fontSize: 12, fontWeight: 600,
                    color: "var(--text-secondary)", margin: 0,
                  }}>
                    Loading {activeDataset?.label}...
                  </p>
                </div>

                {logs.map((line) => (
                  <div
                    key={line.id}
                    className="log-line"
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      padding: "6px 0",
                      borderBottom: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div style={{ width: 18, flexShrink: 0, paddingTop: 1 }}>
                      {line.status === "running" ? (
                        <span className="spinner" style={{ fontSize: 13, color: "var(--accent)" }}>⟳</span>
                      ) : line.status === "warn" ? (
                        <AlertCircle size={13} color="#f59e0b" />
                      ) : (
                        <CheckCircle2 size={13} color="var(--accent)" />
                      )}
                    </div>
                    <div>
                      <p style={{
                        fontSize: 12, fontWeight: 500,
                        color: line.status === "running" ? "var(--text-primary)" : "var(--text-secondary)",
                        margin: 0, lineHeight: 1.4,
                      }}>
                        {line.message}
                      </p>
                      {line.detail && (
                        <p style={{
                          fontSize: 11, color: "var(--text-muted)",
                          margin: "2px 0 0", lineHeight: 1.3,
                        }}>
                          {line.detail}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleCancel}
                  style={{
                    marginTop: 10, fontSize: 11,
                    color: "var(--text-muted)",
                    background: "none", border: "none",
                    cursor: "pointer", padding: 0,
                  }}
                >
                  Cancel
                </button>
              </div>
            )}

            {/* ── Dataset cards grid ── */}
            <div className="samples-grid">
              {SAMPLES.map((s) => (
                <button
                  key={s.key}
                  className={`sample-card${loadingKey === s.key ? " active-card" : ""}`}
                  onClick={() => handleLoad(s.key)}
                  disabled={!!loadingKey}
                >
                  <div style={{ fontSize: 22, marginBottom: 8, lineHeight: 1 }}>
                    {s.icon}
                  </div>
                  <p style={{
                    fontSize: 12, fontWeight: 600,
                    color: "var(--text-primary)",
                    margin: "0 0 3px", lineHeight: 1.3,
                  }}>
                    {s.label}
                  </p>
                  <p style={{
                    fontSize: 11, color: "var(--text-muted)",
                    margin: "0 0 10px", lineHeight: 1.3,
                  }}>
                    {s.desc}
                  </p>
                  <span style={{
                    fontSize: 11, fontWeight: 500,
                    color: loadingKey === s.key ? "var(--accent)" : "var(--accent-light)",
                  }}>
                    {loadingKey === s.key ? "Loading..." : "Try this →"}
                  </span>
                </button>
              ))}
            </div>

            {error && (
              <p style={{
                fontSize: 12, color: "#f87171",
                marginTop: 10, textAlign: "center",
              }}>
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}