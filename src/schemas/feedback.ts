import type { PageMeta } from "@/schemas/common";

/**
 * Mirrors feedback.Response (internal/features/feedback/dto.go).
 *
 * Read-only on the admin side: feedback is what a creator said, and there is
 * nothing for an admin to change about it. The API exposes a list and a get,
 * and no more.
 */
export type Feedback = {
  id: string;
  user_id: string;
  description: string;
  screenshot_url: string | null;
  created_at: string;
};

export type FeedbackListResponse = {
  success: boolean;
  feedback: Feedback[];
  pagination: PageMeta;
};

export type FeedbackResponse = {
  success: boolean;
  feedback: Feedback;
};
