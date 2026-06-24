import { Lightbulb } from "lucide-react";
import { FeedbackBar } from "./FeedbackBar";

interface InsightProps {
  insights: string;
  queryId: string | null;
  datasetId: string;
  question: string;
}

export function InsightCard({ insights, queryId, datasetId, question }: InsightProps) {
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
        .insight-feedback-row {
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid var(--border-subtle);
        }
        @media (max-width: 480px) {
          .insight-card { padding: 14px 12px; }
          .insight-text { font-size: 12px; line-height: 1.7; }
        }
      `}</style>

      <div className="insight-card">
        {/* Header */}
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

        {/* Body */}
        <p className="insight-text">{insights}</p>

        {/* Feedback — delegated to FeedbackBar, returns null if no queryId */}
        <div className="insight-feedback-row">
          <FeedbackBar
            queryId={queryId}
            datasetId={datasetId}
            question={question}
            target="insight"
          />
        </div>
      </div>
    </>
  );
}

export default InsightCard;