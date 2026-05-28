import { useState } from "react";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import api from "../services/api";

interface Props {
  datasetId: string;
  query: string;
  setQuery: (q: string) => void;
  onResult: (res: any, q: string) => void;
}

export default function QueryPanel({ datasetId, query, setQuery, onResult }: Props) {
  const [loading, setLoading] = useState(false);

  const handleQuery = async () => {
    if (!query.trim() || !datasetId || loading) return;
    setLoading(true);
    try {
      const response = await api.post("/query/", { dataset_id: datasetId, question: query });
      onResult(response.data, query);
    } catch (error) {
      console.error("Query failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .query-panel {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          padding: 10px 14px;
          transition: border-color 0.15s;
        }
        .query-panel:focus-within {
          border-color: var(--accent);
        }
        .query-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: 14px;
          color: var(--text-primary);
          font-family: inherit;
          min-width: 0;
        }
        .query-input::placeholder {
          color: var(--text-muted);
        }
        .query-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 600;
          border-radius: 8px;
          padding: 7px 14px;
          border: 1px solid transparent;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.15s;
          white-space: nowrap;
        }
        @media (max-width: 400px) {
          .query-input {
            font-size: 13px;
          }
          .query-btn-text {
            display: none;
          }
          .query-btn {
            padding: 8px 10px;
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      <div className="query-panel">
        <Sparkles size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />

        <input
          className="query-input"
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleQuery()}
          placeholder="Ask a question about your data..."
        />

        <button
          className="query-btn"
          onClick={handleQuery}
          disabled={!query.trim() || loading}
          style={{
            background: !query.trim() || loading ? "var(--bg-elevated)" : "var(--accent)",
            color:      !query.trim() || loading ? "var(--text-muted)"  : "white",
            borderColor: !query.trim() || loading ? "var(--border-subtle)" : "transparent",
            cursor:     !query.trim() || loading ? "not-allowed" : "pointer",
          }}
          onMouseEnter={e => {
            if (query.trim() && !loading)
              (e.currentTarget as HTMLElement).style.background = "#0f766e";
          }}
          onMouseLeave={e => {
            if (query.trim() && !loading)
              (e.currentTarget as HTMLElement).style.background = "var(--accent)";
          }}
        >
          {loading ? (
            <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <>
              <span className="query-btn-text">Run</span>
              <ArrowRight size={12} />
            </>
          )}
        </button>
      </div>
    </>
  );
}