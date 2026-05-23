import { useState } from "react";
import { RotateCcw, Sparkles, Lightbulb, BarChart2 } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

import UploadPanel from "../components/UploadPanel";
import QueryPanel from "../components/QueryPanel";
import ChartRenderer from "../components/chartRenderer";
import DataTable from "../components/DataTable";
import InsightCard from "../components/InsightCard";
import MetricCards from "../components/MetricCards";
import QueryHistory from "../components/QueryHistory";

import type { QueryResponse } from "../types/query";

const HINTS = [
  "Sales by region",
  "Top performing products",
  "Monthly growth trend",
  "Revenue vs target gap",
];

export default function Dashboard() {
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [query, setQuery] = useState<string>("");
  const { isDark, toggle } = useTheme();

  const handleUploadSuccess = (id: string, suggested: string[]) => {
    setDatasetId(id);
    setSuggestions(suggested);
    setResult(null);
    setHistory([]);
    setQuery("");
  };

  const handleResult = (res: QueryResponse, q?: string) => {
    setResult(res);
    if (q) setHistory((prev) => [q, ...prev.slice(0, 5)]);
  };

  const handleReset = () => {
    setDatasetId(null);
    setResult(null);
    setHistory([]);
    setSuggestions([]);
    setQuery("");
  };

  return (
    <div style={{
      minHeight: "100vh",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      background: "var(--bg-base)",
      color: "var(--text-primary)",
      transition: "background 0.2s, color 0.2s",
    }}>

      {/* ── Navbar ── */}
      <nav style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 28px",
        background: isDark ? "rgba(13,17,23,0.92)" : "rgba(240,244,248,0.92)",
        borderBottom: "1px solid var(--border-subtle)",
        backdropFilter: "blur(12px)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <BarChart2 size={16} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>
              Insight Engine
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1 }}>
              AI-powered analytics
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {datasetId && (
            <button
              onClick={handleReset}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 12, fontWeight: 500,
                color: "var(--text-secondary)",
                background: "transparent",
                border: "1px solid var(--border-subtle)",
                borderRadius: 8, padding: "6px 12px",
                cursor: "pointer",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-muted)";
                (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
                (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
              }}
            >
              <RotateCcw size={12} />
              New dataset
            </button>
          )}

          {/* Theme toggle pill — Review Intelligence style */}
          <button
            onClick={toggle}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              fontSize: 12, fontWeight: 600,
              color: "var(--text-secondary)",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 20, padding: "6px 14px",
              cursor: "pointer",
            }}
          >
            {isDark ? "Light" : "Dark"}
            <div style={{
              width: 28, height: 16, borderRadius: 8,
              background: isDark ? "var(--accent)" : "var(--border-muted)",
              position: "relative", transition: "background 0.2s",
            }}>
              <div style={{
                position: "absolute",
                top: 2, left: isDark ? 14 : 2,
                width: 12, height: 12,
                borderRadius: "50%",
                background: "white",
                transition: "left 0.2s",
              }} />
            </div>
          </button>
        </div>
      </nav>

      {/* ── Main ── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {!datasetId ? (
          /* ── Landing ── */
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "80px 24px", gap: 48,
          }}>
            {/* Badge */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 12, fontWeight: 500,
              color: "var(--accent-light)",
              background: "var(--accent-bg)",
              border: "1px solid var(--accent-border)",
              borderRadius: 20, padding: "5px 14px",
            }}>
              <Sparkles size={12} />
              Powered by AI analytics
            </div>

            {/* Hero */}
            <div style={{ textAlign: "center", maxWidth: 560 }}>
              <h1 style={{
                fontSize: "clamp(2rem, 5vw, 3.25rem)",
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                color: "var(--text-primary)",
                marginBottom: 16,
              }}>
                What do you want to{" "}
                <span style={{ color: "var(--accent-light)" }}>know?</span>
              </h1>
              <p style={{
                fontSize: 16, lineHeight: 1.7,
                color: "var(--text-secondary)",
                fontWeight: 400,
              }}>
                Upload a dataset and ask questions in plain English.
                Get charts, metrics, and AI-generated insights — instantly.
              </p>
            </div>

            {/* Upload */}
            <UploadPanel onUploadSuccess={handleUploadSuccess} />

            {/* Hint pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 500 }}>
              {HINTS.map((hint) => (
                <span key={hint} style={{
                  fontSize: 12, fontWeight: 400,
                  color: "var(--text-muted)",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 20, padding: "5px 14px",
                }}>
                  {hint}
                </span>
              ))}
            </div>
          </div>

        ) : (
          /* ── Dashboard ── */
          <div style={{ maxWidth: 1280, width: "100%", margin: "0 auto", padding: "40px 24px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

              {/* Query bar */}
              <QueryPanel
                datasetId={datasetId}
                onResult={handleResult}
                query={query}
                setQuery={setQuery}
              />

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div>
                  <p style={{
                    fontSize: 11, fontWeight: 600,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    color: "var(--text-muted)", marginBottom: 10,
                  }}>
                    Suggested questions
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {suggestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => setQuery(q)}
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          fontSize: 12, fontWeight: 400,
                          color: "var(--text-secondary)",
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: 20, padding: "5px 14px",
                          cursor: "pointer",
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
                        <Lightbulb size={11} />
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Results */}
              {result && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 24 }}>
                  {/* Main */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <MetricCards
                      rows={result.table.data}
                      xColumn={result.chart.x_column}
                      yColumn={result.chart.y_column}
                    />
                    <div style={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: 12, overflow: "hidden",
                    }}>
                      <ChartRenderer table={result.table} chart={result.chart} />
                    </div>
                    <InsightCard insights={result.insights} />
                    <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 20 }}>
                      <DataTable table={result.table} />
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div style={{ position: "sticky", top: 76, alignSelf: "start" }}>
                    <QueryHistory history={history} />
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!result && (
                <div style={{
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  padding: "80px 0", gap: 12,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Sparkles size={18} color="var(--text-muted)" />
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    Ask a question about your data to get started
                  </p>
                </div>
              )}

            </div>
          </div>
        )}
      </main>
    </div>
  );
}