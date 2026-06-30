import { useState } from "react";
import posthog from "posthog-js";
import api from "../services/api";

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

      posthog.capture("feedback_submitted", {
        target,
        rating: selected,
        has_comment: !!commentText,
        dataset_id: datasetId,
        query_id: queryId,
      });
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