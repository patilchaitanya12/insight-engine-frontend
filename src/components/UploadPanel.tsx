import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, X, Loader2 } from "lucide-react";
import api from "../services/api";

interface Props {
  onUploadSuccess: (datasetId: string, suggestions: string[]) => void;
}

export default function UploadPanel({ onUploadSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (!f.name.match(/\.(csv|xlsx)$/i)) {
      setError("Only CSV or Excel files are supported.");
      return;
    }
    setFile(f);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await api.post("/upload/", formData);
      if (response.data.error) {
        setError(response.data.error);
        return;
      }
      onUploadSuccess(response.data.dataset_id, response.data.suggested_questions || []);
    } catch (err: any) {
      setError(`Error: ${err?.response?.status} - ${err?.response?.data?.detail || err?.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0] || null);
  };

  return (
    <div style={{ width: "100%", maxWidth: 480 }}>

      {/* Card */}
      <div style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 16,
        padding: "28px 28px 24px",
      }}>
        <p style={{
          fontSize: 11, fontWeight: 600,
          letterSpacing: "0.08em", textTransform: "uppercase",
          color: "var(--text-muted)", marginBottom: 16,
        }}>
          Upload dataset
        </p>

        {/* Drop zone */}
        <div
          onClick={() => !file && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            border: `1.5px dashed ${dragging ? "var(--accent)" : "var(--border-muted)"}`,
            borderRadius: 10,
            padding: "28px 20px",
            textAlign: "center",
            cursor: file ? "default" : "pointer",
            background: dragging ? "var(--accent-bg)" : "var(--bg-elevated)",
            transition: "border-color 0.15s, background 0.15s",
            marginBottom: 16,
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
                  {file.name.length > 30 ? file.name.slice(0, 30) + "..." : file.name}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--text-muted)", padding: 2, display: "flex",
                  }}
                >
                  <X size={13} />
                </button>
              </div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
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
            <X size={12} />
            {error}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          style={{
            width: "100%",
            padding: "12px 0",
            borderRadius: 10,
            fontSize: 14, fontWeight: 600,
            border: "none", cursor: !file || loading ? "not-allowed" : "pointer",
            background: !file || loading ? "var(--bg-elevated)" : "var(--accent)",
            color: !file || loading ? "var(--text-muted)" : "white",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "background 0.15s",
          }}
          onMouseEnter={e => {
            if (file && !loading)
              (e.currentTarget as HTMLElement).style.background = "#0f766e";
          }}
          onMouseLeave={e => {
            if (file && !loading)
              (e.currentTarget as HTMLElement).style.background = "var(--accent)";
          }}
        >
          {loading ? (
            <>
              <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
              Analysing...
            </>
          ) : (
            "→ Analyse dataset"
          )}
        </button>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}