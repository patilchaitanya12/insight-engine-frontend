import { Clock } from "lucide-react";

interface Props {
  history: string[];
}

export default function QueryHistory({ history }: Props) {
  return (
    <>
      <style>{`
        .qhistory-wrap {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          padding: 14px;
        }
        .qhistory-item {
          font-size: 12px;
          color: var(--text-secondary);
          padding: 7px 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        @media (max-width: 480px) {
          .qhistory-wrap {
            padding: 12px;
          }
          .qhistory-item {
            font-size: 11px;
            padding: 6px 0;
          }
        }
      `}</style>

      <div className="qhistory-wrap">
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <Clock size={11} color="var(--text-muted)" />
          <span style={{
            fontSize: 10, fontWeight: 600,
            letterSpacing: "0.08em", textTransform: "uppercase",
            color: "var(--text-muted)",
          }}>
            Recent queries
          </span>
        </div>

        {history.length === 0 ? (
          <p style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic", margin: 0 }}>
            No queries yet
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {history.map((q, i) => (
              <li
                key={i}
                className="qhistory-item"
                style={{
                  borderBottom: i < history.length - 1
                    ? "1px solid var(--border-subtle)"
                    : "none",
                }}
              >
                {q}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}