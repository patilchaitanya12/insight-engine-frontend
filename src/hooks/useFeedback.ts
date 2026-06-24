import { useState } from "react";
import api from "../services/api";

// Extend this import to match however you import posthog in your project
// e.g. import posthog from "posthog-js";
declare const posthog: { capture: (event: string, props?: Record<string, unknown>) => void } | undefined;

export type FeedbackTarget = "insight" | "chart";

interface UseFeedbackOptions {
  queryId: string | null;
  datasetId: string;
  question: string;
  target: FeedbackTarget;
}

export function useFeedback({ queryId, datasetId, question, target }: UseFeedbackOptions) {
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
        target,
      });
      setSubmitted(true);

      // PostHog tracking
      try {
        if (typeof posthog !== "undefined") {
          posthog.capture("feedback_submitted", {
            target,           // "insight" or "chart"
            rating: selected, // "up" or "down"
            has_comment: !!commentText,
            dataset_id: datasetId,
            query_id: queryId,
          });
        }
      } catch {
        // PostHog errors should never break the feedback flow
      }
    } catch (err) {
      console.error("Failed to submit feedback", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRating = (selected: "up" | "down") => {
    setRating(selected);
    if (selected === "down") {
      setShowComment(true);
    } else {
      sendFeedback(selected);
    }
  };

  const handleCommentSubmit = () => {
    if (rating) sendFeedback(rating, comment.trim() || undefined);
    setShowComment(false);
  };

  return {
    rating,
    submitted,
    showComment,
    comment,
    setComment,
    submitting,
    handleRating,
    handleCommentSubmit,
  };
}