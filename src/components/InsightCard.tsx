import { Lightbulb } from "lucide-react";

interface InsightProps {
  insights: string;
}

export function InsightCard({ insights }: InsightProps) {
  return (
    <>
      <style>{`
        .insight-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-left: 3px solid var(--accent);
          border-radius: 12px;
          padding: 16px;
        }
        .insight-text {
          font-size: 13px;
          line-height: 1.75;
          color: var(--text-secondary);
          white-space: pre-line;
          margin: 0;
        }
        @media (max-width: 480px) {
          .insight-card {
            padding: 14px 12px;
          }
          .insight-text {
            font-size: 12px;
            line-height: 1.7;
          }
        }
      `}</style>

      <div className="insight-card">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7, flexShrink: 0,
            background: "var(--accent-bg)",
            border: "1px solid var(--accent-border)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Lightbulb size={12} color="var(--accent-light)" />
          </div>
          <span style={{
            fontSize: 10, fontWeight: 600,
            letterSpacing: "0.08em", textTransform: "uppercase",
            color: "var(--accent-light)",
          }}>
            AI Insights
          </span>
        </div>

        <p className="insight-text">{insights}</p>
      </div>
    </>
  );
}

export default InsightCard;