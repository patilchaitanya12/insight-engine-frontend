import { useState } from "react";
import { RotateCcw, Sparkles, Lightbulb, BarChart2, LogOut } from "lucide-react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { useTheme } from "../context/ThemeContext";

import UploadPanel from "../components/UploadPanel";
import QueryPanel from "../components/QueryPanel";
import ChartRenderer from "../components/chartRenderer";
import DataTable from "../components/DataTable";
import InsightCard from "../components/InsightCard";
import MetricCards from "../components/MetricCards";
import QueryHistory from "../components/QueryHistory";
import SampleDatasets from "../components/SampleDatasets";

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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { isDark, toggle } = useTheme();
  const { user } = useUser();
  const { signOut } = useClerk();

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
        padding: "10px 16px",
        background: isDark ? "rgba(13,17,23,0.92)" : "rgba(240,244,248,0.92)",
        borderBottom: "1px solid var(--border-subtle)",
        backdropFilter: "blur(12px)",
        gap: 8,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: "var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <BarChart2 size={15} color="white" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2, whiteSpace: "nowrap" }}>
              Insight Engine
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", lineHeight: 1, whiteSpace: "nowrap" }}>
              AI-powered analytics
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {datasetId && (
            <button
              onClick={handleReset}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                fontSize: 11, fontWeight: 500,
                color: "var(--text-secondary)",
                background: "transparent",
                border: "1px solid var(--border-subtle)",
                borderRadius: 8, padding: "5px 10px",
                cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              <RotateCcw size={11} />
              New dataset
            </button>
          )}

          <button
            onClick={toggle}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 11, fontWeight: 600,
              color: "var(--text-secondary)",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 20, padding: "5px 12px",
              cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            {isDark ? "Light" : "Dark"}
            <div style={{
              width: 26, height: 15, borderRadius: 8,
              background: isDark ? "var(--accent)" : "var(--border-muted)",
              position: "relative", transition: "background 0.2s", flexShrink: 0,
            }}>
              <div style={{
                position: "absolute",
                top: 2, left: isDark ? 13 : 2,
                width: 11, height: 11,
                borderRadius: "50%",
                background: "white",
                transition: "left 0.2s",
              }} />
            </div>
          </button>

          {/* User avatar + dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowUserMenu(prev => !prev)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 30, height: 30, borderRadius: "50%",
                background: "var(--accent)",
                border: "none", cursor: "pointer",
                overflow: "hidden", flexShrink: 0,
                padding: 0,
              }}
            >
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={user.fullName || "User"}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ fontSize: 12, fontWeight: 700, color: "white" }}>
                  {(user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0] || "U").toUpperCase()}
                </span>
              )}
            </button>

            {showUserMenu && (
              <>
                {/* Click-away overlay */}
                <div
                  onClick={() => setShowUserMenu(false)}
                  style={{
                    position: "fixed", inset: 0, zIndex: 60,
                  }}
                />
                <div style={{
                  position: "absolute", top: "calc(100% + 8px)", right: 0,
                  zIndex: 61, minWidth: 180,
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 10,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                  padding: 6,
                }}>
                  {/* User info */}
                  <div style={{
                    padding: "8px 10px",
                    borderBottom: "1px solid var(--border-subtle)",
                    marginBottom: 4,
                  }}>
                    <p style={{
                      fontSize: 12, fontWeight: 600,
                      color: "var(--text-primary)",
                      margin: 0, whiteSpace: "nowrap",
                      overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {user?.fullName || "User"}
                    </p>
                    <p style={{
                      fontSize: 11, color: "var(--text-muted)",
                      margin: 0, whiteSpace: "nowrap",
                      overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {user?.emailAddresses?.[0]?.emailAddress}
                    </p>
                  </div>

                  {/* Sign out */}
                  <button
                    onClick={() => signOut()}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      width: "100%", fontSize: 12, fontWeight: 500,
                      color: "var(--text-secondary)",
                      background: "transparent",
                      border: "none", borderRadius: 6,
                      padding: "8px 10px", cursor: "pointer",
                      textAlign: "left",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)";
                      (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                    }}
                  >
                    <LogOut size={13} />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Main ── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {!datasetId ? (
          /* ── Landing ── */
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "48px 16px", gap: 36,
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
            <div style={{ textAlign: "center", maxWidth: 560, padding: "0 4px" }}>
              <h1 style={{
                fontSize: "clamp(1.75rem, 7vw, 3.25rem)",
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                color: "var(--text-primary)",
                marginBottom: 14,
              }}>
                What do you want to{" "}
                <span style={{ color: "var(--accent-light)" }}>know?</span>
              </h1>
              <p style={{
                fontSize: "clamp(14px, 4vw, 16px)", lineHeight: 1.7,
                color: "var(--text-secondary)",
                fontWeight: 400,
              }}>
                Upload a dataset and ask questions in plain English.
                Get charts, metrics, and AI-generated insights — instantly.
              </p>
            </div>

            {/* Upload — full width on mobile */}
            <div style={{ width: "100%", maxWidth: 480 }}>
              <UploadPanel onUploadSuccess={handleUploadSuccess} />
            </div>

            {/* Hint pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 500, padding: "0 8px" }}>
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

            {/* Sample datasets */}
            <SampleDatasets onSuccess={handleUploadSuccess} />
          </div>

        ) : (
          /* ── Dashboard ── */
          <div style={{ width: "100%", maxWidth: 1280, margin: "0 auto", padding: "20px 14px 40px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

              {/* Query bar */}
              <QueryPanel
                datasetId={datasetId}
                onResult={handleResult}
                query={query}
                setQuery={setQuery}
              />

              {/* Suggestions — horizontal scroll on mobile */}
              {suggestions.length > 0 && (
                <div>
                  <p style={{
                    fontSize: 11, fontWeight: 600,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    color: "var(--text-muted)", marginBottom: 10,
                  }}>
                    Suggested questions
                  </p>
                  <div style={{
                    display: "flex", gap: 8,
                    overflowX: "auto", paddingBottom: 4,
                    /* hide scrollbar but allow scroll */
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                  }}>
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
                          whiteSpace: "nowrap", flexShrink: 0,
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
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Metric cards */}
                  <MetricCards
                    rows={result.table.data}
                    xColumn={result.chart.x_column}
                    yColumn={result.chart.y_column}
                  />

                  {/* Chart */}
                  <div style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 12, overflow: "hidden",
                  }}>
                    <ChartRenderer table={result.table} chart={result.chart} queryId={result.query_id} datasetId={datasetId} question={query} />
                  </div>

                  {/* Insight — key forces React to remount this component on every
                      new query, so feedback state (submitted/rating) resets instead
                      of carrying over from the previous question's result */}
                  <InsightCard
                    key={result.query_id ?? query}
                    insights={result.insights}
                    queryId={result.query_id}
                    datasetId={datasetId}
                    question={query}
                  />

                  {/* Query history — inline on mobile instead of sticky sidebar */}
                  {history.length > 0 && (
                    <QueryHistory history={history} />
                  )}

                  {/* Data table */}
                  <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 16 }}>
                    <DataTable table={result.table} />
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!result && (
                <div style={{
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  padding: "60px 0", gap: 12,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Sparkles size={18} color="var(--text-muted)" />
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", padding: "0 20px" }}>
                    Ask a question about your data to get started
                  </p>
                </div>
              )}

            </div>
          </div>
        )}
      </main>

      {/* Hide scrollbar for suggestion pills */}
      <style>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}