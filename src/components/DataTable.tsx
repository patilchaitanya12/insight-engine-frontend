import { useState } from "react";
import type { TableData } from "../types/query";

interface Props {
  table: TableData;
}

export default function DataTable({ table }: Props) {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  return (
    <div style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--border-subtle)",
      borderRadius: 12,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 20px 12px",
        borderBottom: "1px solid var(--border-subtle)",
      }}>
        <p style={{
          fontSize: 12, fontWeight: 600,
          letterSpacing: "-0.01em",
          color: "var(--text-secondary)", margin: 0,
        }}>
          Raw data explorer
        </p>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", maxHeight: 400, overflowY: "auto" }}>
        <table style={{
          width: "100%", borderCollapse: "collapse",
          fontSize: 13,
        }}>
          <thead>
            <tr>
              {table.columns.map((col) => (
                <th key={col} style={{
                  padding: "10px 20px",
                  textAlign: "left",
                  fontSize: 11, fontWeight: 600,
                  letterSpacing: "0.07em", textTransform: "uppercase",
                  color: "var(--text-muted)",
                  background: "var(--bg-elevated)",
                  borderBottom: "1px solid var(--border-subtle)",
                  position: "sticky", top: 0,
                  whiteSpace: "nowrap",
                }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.data.map((row, i) => (
              <tr
                key={i}
                onMouseEnter={() => setHoveredRow(i)}
                onMouseLeave={() => setHoveredRow(null)}
                style={{
                  background: hoveredRow === i ? "var(--bg-elevated)" : "transparent",
                  transition: "background 0.1s",
                }}
              >
                {table.columns.map((col) => (
                  <td key={col} style={{
                    padding: "10px 20px",
                    color: "var(--text-secondary)",
                    borderBottom: i < table.data.length - 1 ? "1px solid var(--border-subtle)" : "none",
                    whiteSpace: "nowrap",
                  }}>
                    {row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}