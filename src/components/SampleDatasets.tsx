import { useState } from "react";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import api from "../services/api";

interface Props {
  onSuccess: (datasetId: string, suggestions: string[]) => void;
}

const SAMPLES = [
  {
    key: "household",
    icon: "🏠",
    label: "Household Expenses",
    desc: "12 months · family spending",
    questions: ["Which category costs most?", "Monthly spending trend"],
  },
  {
    key: "investment",
    icon: "📈",
    label: "Investment Portfolio",
    desc: "24 months · 8 assets",
    questions: ["Best performing asset?", "Total gains by class"],
  },
  {
    key: "retail",
    icon: "🛍️",
    label: "Retail Sales",
    desc: "18 months · 10 products",
    questions: ["Top product by revenue?", "Profit by region"],
  },
  {
    key: "hr",
    icon: "👥",
    label: "HR Analytics",
    desc: "200 employees · 6 depts",
    questions: ["Avg salary by dept?", "Performance scores"],
  },
  {
    key: "health",
    icon: "🏃",
    label: "Health & Fitness",
    desc: "180 days · daily tracker",
    questions: ["Weight trend over time?", "Sleep vs mood"],
  },
  {
    key: "restaurant",
    icon: "🍽️",
    label: "Restaurant Analytics",
    desc: "90 days · 10 dishes",
    questions: ["Most profitable dish?", "Revenue trend"],
  },
];

export default function SampleDatasets({ onSuccess }: Props) {
  const [expanded, setExpanded]   = useState(false);
  const [loading, setLoading]     = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);

  const handleLoad = async (key: string) => {
    setLoading(key);
    setError(null);
    try {
      const res = await api.post(`/datasets/sample/${key}`);
      onSuccess(res.data.dataset_id, res.data.suggested_questions || []);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load sample. Try again.");
      setLoading(null);
    }
  };

  return (
    <>
      <style>{`
        @keyframes expandDown {
          from { opacity: 0; transform: translateY(-8px); max-height: 0; }
          to   { opacity: 1; transform: translateY(0);    max-height: 600px; }
        }
        @keyframes collapseUp {
          from { opacity: 1; transform: translateY(0);    max-height: 600px; }
          to   { opacity: 0; transform: translateY(-8px); max-height: 0; }
        }
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
          transition: border-color 0.15s, transform 0.15s, background 0.15s;
          text-align: left;
          width: 100%;
        }
        .sample-card:hover {
          border-color: var(--accent);
          transform: translateY(-2px);
        }
        .sample-card:disabled {
          cursor: not-allowed;
          opacity: 0.6;
          transform: none;
        }
        /* Mobile: horizontal scroll row */
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
          .sample-card {
            flex-shrink: 0;
            width: 148px;
          }
        }
        /* Tablet: 2 columns */
        @media (min-width: 601px) and (max-width: 860px) {
          .samples-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: 480 }}>

        {/* Toggle button */}
        <button
          onClick={() => { setExpanded(p => !p); setError(null); }}
          style={{
            width: "100%",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            fontSize: 13, fontWeight: 500,
            color: "var(--text-secondary)",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 10, padding: "10px 0",
            cursor: "pointer",
            transition: "border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
            (e.currentTarget as HTMLElement).style.color = "var(--accent-light)";
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

        {/* Expandable grid */}
        {expanded && (
          <div style={{
            animation: "expandDown 0.25s ease forwards",
            overflow: "hidden",
          }}>
            <div className="samples-grid">
              {SAMPLES.map((s) => (
                <button
                  key={s.key}
                  className="sample-card"
                  onClick={() => handleLoad(s.key)}
                  disabled={loading !== null}
                >
                  {/* Icon */}
                  <div style={{ fontSize: 22, marginBottom: 8, lineHeight: 1 }}>
                    {s.icon}
                  </div>

                  {/* Label */}
                  <p style={{
                    fontSize: 12, fontWeight: 600,
                    color: "var(--text-primary)",
                    margin: "0 0 3px", lineHeight: 1.3,
                  }}>
                    {s.label}
                  </p>

                  {/* Desc */}
                  <p style={{
                    fontSize: 11, color: "var(--text-muted)",
                    margin: "0 0 10px", lineHeight: 1.3,
                  }}>
                    {s.desc}
                  </p>

                  {/* Loading or arrow */}
                  {loading === s.key ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Loader2
                        size={11}
                        color="var(--accent)"
                        style={{ animation: "spin 0.8s linear infinite" }}
                      />
                      <span style={{ fontSize: 11, color: "var(--accent)" }}>
                        Loading...
                      </span>
                    </div>
                  ) : (
                    <span style={{
                      fontSize: 11, color: "var(--accent-light)",
                      fontWeight: 500,
                    }}>
                      Try this →
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Error */}
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

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}