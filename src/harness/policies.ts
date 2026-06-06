import type { SendResultStatus } from "../domain";
import { classifyRsvp } from "../agents/specialists";
import type { AgentPolicyResult } from "./types";

export function canSendInvites(eventStatus: string): AgentPolicyResult {
  if (eventStatus === "approved") return { allow: true };

  return {
    allow: false,
    fallback: "I can't send yet. Please review the invite and reply /approve first.",
    trace: {
      agent: "Safety & Trust",
      action: "Block outbound because host has not approved the draft.",
    },
  };
}

export function inviteBatchLimit(env = process.env): number {
  const limit = Number.parseInt(env.PULLUP_MAX_INVITES_PER_BATCH ?? "20", 10);
  return Number.isFinite(limit) && limit > 0 ? limit : 20;
}

export function classifyGuestReply(text: string) {
  return classifyRsvp(text) ?? "needs_human";
}

export function sendFailureStatusFromError(error: unknown): SendResultStatus {
  const details = error instanceof Error ? error.message : String(error);
  return details.includes("Target not allowed") ? "target_not_allowed" : "failed";
}
