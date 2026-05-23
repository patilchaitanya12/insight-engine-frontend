import { Lightbulb } from "lucide-react";

interface InsightProps {
  insights: string;
}

export function InsightCard({ insights }: InsightProps) {
  return (
    <div style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--border-subtle)",
      borderRadius: 12, padding: "20px 20px 20px 20px",
      borderLeft: "3px solid var(--accent)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: "var(--accent-bg)",
          border: "1px solid var(--accent-border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Lightbulb size={13} color="var(--accent-light)" />
        </div>
        <span style={{
          fontSize: 11, fontWeight: 600,
          letterSpacing: "0.08em", textTransform: "uppercase",
          color: "var(--accent-light)",
        }}>
          AI Insights
        </span>
      </div>
      <p style={{
        fontSize: 14, lineHeight: 1.75,
        color: "var(--text-secondary)",
        whiteSpace: "pre-line",
      }}>
        {insights}
      </p>
    </div>
  );
}

export default InsightCard;