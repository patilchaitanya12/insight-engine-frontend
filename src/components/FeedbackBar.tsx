import { ThumbsUp, ThumbsDown, Check } from "lucide-react";
import { useFeedback, type FeedbackTarget } from "../hooks/useFeedback";

interface FeedbackBarProps {
  queryId: string | null;
  datasetId: string;
  question: string;
  target: FeedbackTarget;
  /** Optional label before the thumbs. Defaults to "Was this helpful?" */
  label?: string;
}

/**
 * FeedbackBar — a self-contained thumbs up/down row.
 *
 * Drop it anywhere a feedback surface is needed:
 *
 *   <FeedbackBar queryId={queryId} datasetId={datasetId} question={question} target="insight" />
 *   <FeedbackBar queryId={queryId} datasetId={datasetId} question={question} target="chart" label="Was this chart helpful?" />
 *
 * Returns null when queryId is absent — safe to always render.
 */
export function FeedbackBar({
  queryId,
  datasetId,
  question,
  target,
  label = "Was this helpful?",
}: FeedbackBarProps) {
  const {
    rating,
    submitted,
    showComment,
    comment,
    setComment,
    submitting,
    handleRating,
    handleCommentSubmit,
  } = useFeedback({ queryId, datasetId, question, target });

  if (!queryId) return null;

  return (
    <>
      <style>{`
        .feedback-bar-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .feedback-bar-btn {
          display: flex; align-items: center; justify-content: center;
          width: 28px; height: 28px;
          border-radius: 7px;
          border: 1px solid var(--border-subtle);
          background: var(--bg-elevated);
          color: var(--text-muted);
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s, background 0.15s;
        }
        .feedback-bar-btn:hover:not(:disabled) {
          border-color: var(--border-muted);
          color: var(--text-secondary);
        }
        .feedback-bar-btn:disabled {
          opacity: 0.5;
          cursor: default;
        }
        .feedback-bar-btn.active-up {
          border-color: #10b981;
          color: #10b981;
          background: rgba(16,185,129,0.08);
        }
        .feedback-bar-btn.active-down {
          border-color: #ef4444;
          color: #ef4444;
          background: rgba(239,68,68,0.08);
        }
        .feedback-bar-comment-box {
          margin-top: 8px;
          display: flex;
          gap: 8px;
        }
        .feedback-bar-comment-input {
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
        .feedback-bar-comment-input:focus {
          border-color: var(--accent);
        }
        .feedback-bar-comment-submit {
          font-size: 12px; font-weight: 600;
          color: white;
          background: var(--accent);
          border: none; border-radius: 7px;
          padding: 7px 14px;
          cursor: pointer;
          flex-shrink: 0;
        }
      `}</style>

      <div className="feedback-bar-row">
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
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</span>
            <button
              className={`feedback-bar-btn ${rating === "up" ? "active-up" : ""}`}
              onClick={() => handleRating("up")}
              disabled={submitting}
              title="Helpful"
            >
              <ThumbsUp size={13} />
            </button>
            <button
              className={`feedback-bar-btn ${rating === "down" ? "active-down" : ""}`}
              onClick={() => handleRating("down")}
              disabled={submitting}
              title="Not helpful"
            >
              <ThumbsDown size={13} />
            </button>
          </>
        )}
      </div>

      {showComment && !submitted && (
        <div className="feedback-bar-comment-box">
          <input
            className="feedback-bar-comment-input"
            type="text"
            placeholder="What went wrong? (optional)"
            value={comment}
            onChange={e => setComment(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleCommentSubmit()}
            autoFocus
          />
          <button className="feedback-bar-comment-submit" onClick={handleCommentSubmit}>
            Send
          </button>
        </div>
      )}
    </>
  );
}

export default FeedbackBar;