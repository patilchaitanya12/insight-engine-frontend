import { useState } from "react";
import type { TableData } from "../types/query";

interface Props {
  table: TableData;
}

export default function DataTable({ table }: Props) {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  return (
    <>
      <style>{`
        .datatable-wrap {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          overflow: hidden;
        }
        .datatable-header {
          padding: 12px 16px 10px;
          border-bottom: 1px solid var(--border-subtle);
        }
        .datatable-header p {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: var(--text-secondary);
          margin: 0;
        }
        .datatable-scroll {
          overflow-x: auto;
          overflow-y: auto;
          max-height: 340px;
          /* always show horizontal scrollbar on mobile so user knows it scrolls */
          -webkit-overflow-scrolling: touch;
        }
        .datatable-scroll::-webkit-scrollbar {
          height: 4px;
          width: 4px;
        }
        .datatable-scroll::-webkit-scrollbar-track {
          background: var(--bg-elevated);
        }
        .datatable-scroll::-webkit-scrollbar-thumb {
          background: var(--border-muted);
          border-radius: 2px;
        }
        .datatable-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        .datatable-th {
          padding: 9px 14px;
          text-align: left;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--text-muted);
          background: var(--bg-elevated);
          border-bottom: 1px solid var(--border-subtle);
          position: sticky;
          top: 0;
          white-space: nowrap;
          z-index: 1;
        }
        .datatable-td {
          padding: 9px 14px;
          color: var(--text-secondary);
          white-space: nowrap;
          font-size: 12px;
        }
        @media (max-width: 480px) {
          .datatable-header {
            padding: 10px 12px 8px;
          }
          .datatable-th {
            padding: 8px 10px;
            font-size: 9px;
          }
          .datatable-td {
            padding: 8px 10px;
            font-size: 11px;
          }
        }
      `}</style>

      <div className="datatable-wrap">
        <div className="datatable-header">
          <p>Raw data explorer</p>
        </div>

        <div className="datatable-scroll">
          <table className="datatable-table">
            <thead>
              <tr>
                {table.columns.map(col => (
                  <th key={col} className="datatable-th">{col}</th>
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
                  {table.columns.map(col => (
                    <td
                      key={col}
                      className="datatable-td"
                      style={{
                        borderBottom: i < table.data.length - 1
                          ? "1px solid var(--border-subtle)"
                          : "none",
                      }}
                    >
                      {row[col]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}