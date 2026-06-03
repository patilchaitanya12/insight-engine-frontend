import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle } from "lucide-react";
import api from "../services/api";

interface Props {
  onUploadSuccess: (datasetId: string, suggestions: string[]) => void;
}

interface LogLine {
  id: number;
  icon: string;
  message: string;
  detail?: string;
  status: "running" | "done" | "warn";
}

export default function UploadPanel({ onUploadSuccess }: Props) {
  const [file, setFile]       = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase]     = useState<"idle" | "streaming" | "error">("idle");
  const [logs, setLogs]       = useState<LogLine[]>([]);
  const [error, setError]     = useState<string | null>(null);
  const inputRef              = useRef<HTMLInputElement>(null);
  const logIdRef              = useRef(0);
  const esRef                 = useRef<EventSource | null>(null);

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (!f.name.match(/\.(csv|xlsx)$/i)) {
      setError("Only CSV or Excel files are supported.");
      return;
    }
    setFile(f);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0] || null);
  };

  const addLog = (icon: string, message: string, detail = "", status: LogLine["status"] = "done") => {
    const id = ++logIdRef.current;
    setLogs(prev => [...prev, { id, icon, message, detail, status }]);
  };

  const handleUpload = async () => {
    if (!file) return;

    setPhase("streaming");
    setLogs([]);
    setError(null);

    // ── Phase 1: POST file, get job_id ────────────────────────────────────
    addLog("⟳", "Uploading file...", "", "running");

    let jobId: string;
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/upload/start", formData);
      jobId = res.data.job_id;

      setLogs(prev =>
        prev.map(l => l.id === 1 ? { ...l, icon: "✓", status: "done" } : l)
      );
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Upload failed";
      setError(msg);
      setPhase("error");
      setLogs([]);
      return;
    }

    // ── Phase 2: Open SSE stream ──────────────────────────────────────────
    const baseUrl = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
    const es = new EventSource(`${baseUrl}/upload/stream/${jobId}`);
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "progress") {
          const isCheck = data.icon === "✓";
          const isWarn  = data.icon === "⚠️";
          addLog(
            data.icon,
            data.message,
            data.detail || "",
            isCheck ? "done" : isWarn ? "warn" : "running"
          );
        }

        if (data.type === "done") {
          addLog("✓", "All done! Opening your dashboard...", "", "done");
          es.close();
          esRef.current = null;
          setTimeout(() => {
            onUploadSuccess(data.dataset_id, data.suggested_questions || []);
          }, 600);
        }

        if (data.type === "error") {
          setError(data.message);
          setPhase("error");
          setLogs([]);
          es.close();
          esRef.current = null;
        }
      } catch {
        // ignore malformed events
      }
    };

    es.onerror = () => {
      setError("Connection lost. Please try again.");
      setPhase("error");
      setLogs([]);
      es.close();
      esRef.current = null;
    };
  };

  const handleReset = () => {
    esRef.current?.close();
    setFile(null);
    setPhase("idle");
    setLogs([]);
    setError(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .log-line {
          animation: fadeSlideIn 0.25s ease forwards;
        }
        .spinner {
          display: inline-block;
          animation: spin 0.8s linear infinite;
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: 480 }}>
        <div style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 16,
          padding: "24px 24px 20px",
        }}>
          <p style={{
            fontSize: 11, fontWeight: 600,
            letterSpacing: "0.08em", textTransform: "uppercase",
            color: "var(--text-muted)", marginBottom: 16, margin: "0 0 16px",
          }}>
            Upload dataset
          </p>

          {/* ── Streaming phase ── */}
          {phase === "streaming" && (
            <div style={{ padding: "8px 0 4px" }}>
              {logs.map((line) => (
                <div
                  key={line.id}
                  className="log-line"
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    padding: "7px 0",
                    borderBottom: "1px solid var(--border-subtle)",
                  }}
                >
                  {/* Icon */}
                  <div style={{ width: 20, flexShrink: 0, paddingTop: 1 }}>
                    {line.status === "running" ? (
                      <span className="spinner" style={{ fontSize: 13, color: "var(--accent)" }}>⟳</span>
                    ) : line.status === "warn" ? (
                      <AlertCircle size={14} color="#f59e0b" />
                    ) : (
                      <CheckCircle2 size={14} color="var(--accent)" />
                    )}
                  </div>

                  {/* Text */}
                  <div>
                    <p style={{
                      fontSize: 13, fontWeight: 500,
                      color: line.status === "running"
                        ? "var(--text-primary)"
                        : "var(--text-secondary)",
                      margin: 0, lineHeight: 1.4,
                    }}>
                      {line.message}
                    </p>
                    {line.detail && (
                      <p style={{
                        fontSize: 11, color: "var(--text-muted)",
                        margin: "2px 0 0", lineHeight: 1.3,
                      }}>
                        {line.detail}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* Cancel */}
              <button
                onClick={handleReset}
                style={{
                  marginTop: 14, fontSize: 11,
                  color: "var(--text-muted)",
                  background: "none", border: "none",
                  cursor: "pointer", padding: 0,
                }}
              >
                Cancel
              </button>
            </div>
          )}

          {/* ── Idle / Error phase ── */}
          {phase !== "streaming" && (
            <>
              {/* Drop zone */}
              <div
                onClick={() => !file && inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                style={{
                  border: `1.5px dashed ${dragging ? "var(--accent)" : "var(--border-muted)"}`,
                  borderRadius: 10,
                  padding: "24px 20px",
                  textAlign: "center",
                  cursor: file ? "default" : "pointer",
                  background: dragging ? "var(--accent-bg)" : "var(--bg-elevated)",
                  transition: "border-color 0.15s, background 0.15s",
                  marginBottom: 14,
                }}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,.xlsx"
                  style={{ display: "none" }}
                  onChange={(e) => handleFile(e.target.files?.[0] || null)}
                />

                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 12px",
                }}>
                  {file
                    ? <FileSpreadsheet size={18} color="var(--accent-light)" />
                    : <Upload size={18} color="var(--text-muted)" />
                  }
                </div>

                {file ? (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                        {file.name.length > 32 ? file.name.slice(0, 30) + "..." : file.name}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setFile(null); setError(null); }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2, display: "flex" }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, marginBottom: 0 }}>
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 4 }}>
                      Drop your file here
                    </p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12 }}>
                      CSV or Excel · up to 10MB
                    </p>
                    <span style={{
                      fontSize: 11, fontWeight: 500,
                      color: "var(--text-secondary)",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: 6, padding: "4px 12px",
                    }}>
                      Browse files
                    </span>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  fontSize: 12, color: "#f87171",
                  background: "rgba(248,113,113,0.08)",
                  border: "1px solid rgba(248,113,113,0.2)",
                  borderRadius: 8, padding: "8px 12px", marginBottom: 14,
                }}>
                  <X size={12} style={{ flexShrink: 0 }} />
                  {error}
                </div>
              )}

              {/* CTA */}
              <button
                onClick={handleUpload}
                disabled={!file}
                style={{
                  width: "100%", padding: "12px 0",
                  borderRadius: 10, fontSize: 14, fontWeight: 600,
                  border: "none",
                  cursor: !file ? "not-allowed" : "pointer",
                  background: !file ? "var(--bg-elevated)" : "var(--accent)",
                  color: !file ? "var(--text-muted)" : "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => {
                  if (file) (e.currentTarget as HTMLElement).style.background = "#0f766e";
                }}
                onMouseLeave={e => {
                  if (file) (e.currentTarget as HTMLElement).style.background = "var(--accent)";
                }}
              >
                → Analyse dataset
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}