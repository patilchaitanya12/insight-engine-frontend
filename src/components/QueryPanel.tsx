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
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      background: "var(--bg-surface)",
      border: "1px solid var(--border-subtle)",
      borderRadius: 12, padding: "10px 16px",
      transition: "border-color 0.15s",
    }}
    onFocusCapture={e => (e.currentTarget.style.borderColor = "var(--accent)")}
    onBlurCapture={e => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
    >
      <Sparkles size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleQuery()}
        placeholder="Ask a question about your data..."
        style={{
          flex: 1, background: "transparent",
          border: "none", outline: "none",
          fontSize: 14, color: "var(--text-primary)",
          fontFamily: "inherit",
        }}
      />

      <button
        onClick={handleQuery}
        disabled={!query.trim() || loading}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 12, fontWeight: 600,
          color: !query.trim() || loading ? "var(--text-muted)" : "white",
          background: !query.trim() || loading ? "var(--bg-elevated)" : "var(--accent)",
          border: "1px solid",
          borderColor: !query.trim() || loading ? "var(--border-subtle)" : "transparent",
          borderRadius: 8, padding: "7px 14px",
          cursor: !query.trim() || loading ? "not-allowed" : "pointer",
          flexShrink: 0, transition: "background 0.15s",
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
        {loading
          ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
          : <><span>Run</span><ArrowRight size={12} /></>
        }
      </button>
      <style>{`@keyframes spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}