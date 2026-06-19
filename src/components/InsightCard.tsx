import { useState } from "react";
import { Lightbulb, ThumbsUp, ThumbsDown, Check } from "lucide-react";
import api from "../services/api";

interface InsightProps {
  insights: string;
  queryId: string | null;
  datasetId: string;
  question: string;
}

export function InsightCard({ insights, queryId, datasetId, question }: InsightProps) {
  const [rating, setRating] = useState<"up" | "down" | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const sendFeedback = async (selected: "up" | "down", commentText?: string) => {
    if (!queryId || submitting) return;
    setSubmitting(true);
    try {
      await api.post("/feedback/", {
        query_history_id: queryId,
        dataset_id: datasetId,
        question,
        rating: selected,
        comment: commentText || null,
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Failed to submit feedback", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRating = (selected: "up" | "down") => {
    setRating(selected);
    if (selected === "down") {
      // For thumbs down, give the user a chance to add a comment first
      setShowComment(true);
    } else {
      sendFeedback(selected);
    }
  };

  const handleCommentSubmit = () => {
    if (rating) sendFeedback(rating, comment.trim() || undefined);
    setShowComment(false);
  };

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
        .feedback-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid var(--border-subtle);
        }
        .feedback-btn {
          display: flex; align-items: center; justify-content: center;
          width: 28px; height: 28px;
          border-radius: 7px;
          border: 1px solid var(--border-subtle);
          background: var(--bg-elevated);
          color: var(--text-muted);
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s, background 0.15s;
        }
        .feedback-btn:hover {
          border-color: var(--border-muted);
          color: var(--text-secondary);
        }
        .feedback-btn.active-up {
          border-color: #10b981;
          color: #10b981;
          background: rgba(16,185,129,0.08);
        }
        .feedback-btn.active-down {
          border-color: #ef4444;
          color: #ef4444;
          background: rgba(239,68,68,0.08);
        }
        .feedback-comment-box {
          margin-top: 10px;
          display: flex;
          gap: 8px;
        }
        .feedback-comment-input {
          flex: 1;
          font-size: 12px;
          padding: 7px 10px;
          border-radius: 7px;
          border: 1px solid var(--border-subtle);
          background: var(--bg-elevated);
          color: var(--text-primary);
          outline: none;
          font-family: inherit;
        }
        .feedback-comment-input:focus {
          border-color: var(--accent);
        }
        .feedback-comment-submit {
          font-size: 12px; font-weight: 600;
          color: white;
          background: var(--accent);
          border: none; border-radius: 7px;
          padding: 7px 14px;
          cursor: pointer;
          flex-shrink: 0;
        }
        @media (max-width: 480px) {
          .insight-card {
            padding: 14px 12px;
          }
          .insight-text {
            font-size: 12px;
            line-height: 1.7;
          }
        }
      `}</style>

      <div className="insight-card">
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

        <p className="insight-text">{insights}</p>

        {/* Feedback row — only shown if we have a query_id to reference */}
        {queryId && (
          <div className="feedback-row">
            {submitted ? (
              <span style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 11, color: "var(--text-muted)",
              }}>
                <Check size={12} color="#10b981" />
                Thanks for the feedback
              </span>
            ) : (
              <>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  Was this helpful?
                </span>
                <button
                  className={`feedback-btn ${rating === "up" ? "active-up" : ""}`}
                  onClick={() => handleRating("up")}
                  disabled={submitting}
                  title="Helpful"
                >
                  <ThumbsUp size={13} />
                </button>
                <button
                  className={`feedback-btn ${rating === "down" ? "active-down" : ""}`}
                  onClick={() => handleRating("down")}
                  disabled={submitting}
                  title="Not helpful"
                >
                  <ThumbsDown size={13} />
                </button>
              </>
            )}
          </div>
        )}

        {/* Optional comment box — shown after thumbs down */}
        {showComment && !submitted && (
          <div className="feedback-comment-box">
            <input
              className="feedback-comment-input"
              type="text"
              placeholder="What went wrong? (optional)"
              value={comment}
              onChange={e => setComment(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCommentSubmit()}
              autoFocus
            />
            <button className="feedback-comment-submit" onClick={handleCommentSubmit}>
              Send
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default InsightCard;
