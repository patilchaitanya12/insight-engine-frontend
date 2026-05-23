import { Clock } from "lucide-react";

interface Props {
  history: string[];
}

export default function QueryHistory({ history }: Props) {
  return (
    <div style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--border-subtle)",
      borderRadius: 12, padding: "16px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
        <Clock size={12} color="var(--text-muted)" />
        <span style={{
          fontSize: 11, fontWeight: 600,
          letterSpacing: "0.08em", textTransform: "uppercase",
          color: "var(--text-muted)",
        }}>
          Recent queries
        </span>
      </div>

      {history.length === 0 ? (
        <p style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
          No queries yet
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {history.map((q, i) => (
            <li key={i} style={{
              fontSize: 12, color: "var(--text-secondary)",
              padding: "8px 0",
              borderBottom: i < history.length - 1 ? "1px solid var(--border-subtle)" : "none",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {q}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}