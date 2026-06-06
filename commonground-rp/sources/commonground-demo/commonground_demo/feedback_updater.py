from __future__ import annotations

from .models import Feedback, User


def feedback_reward(feedback: Feedback) -> float:
    return (
        0.25 * float(feedback.attended)
        + 0.25 * feedback.conversation_natural
        + 0.20 * feedback.would_meet_similar
        + 0.15 * feedback.activity_container_fit
        + 0.10 * float(feedback.mutual_opt_in)
        + 0.05 * float(feedback.no_safety_issue)
    )


def update_vibe_profile(user: User, feedback: Feedback) -> dict:
    reward = feedback_reward(feedback)
    previous = user.vibe_profile.copy()
    if reward >= 0.78:
        direction = "exploit nearby proven vibe"
    elif reward >= 0.55:
        direction = "explore adjacent vibe"
    else:
        direction = "move away from this vibe"
    updated = {
        **previous,
        "last_feedback_reward": round(reward, 3),
        "last_energy_feedback": feedback.energy_feedback,
        "next_tuning_direction": direction,
        "next_tuning_note": feedback.tune_next,
        "human_friendly_note": "Preference tuning only; this does not rate another person.",
    }
    user.vibe_profile = updated
    return updated


def summarize_feedback_learning(users: list[User], feedbacks: list[Feedback]) -> list[dict]:
    by_user = {user.user_id: user for user in users}
    summaries = []
    for feedback in feedbacks[:5]:
        user = by_user.get(feedback.user_id)
        if not user:
            continue
        updated = update_vibe_profile(user, feedback)
        summaries.append(
            {
                "user_id": user.user_id,
                "reward": updated["last_feedback_reward"],
                "energy_feedback": feedback.energy_feedback,
                "next_tuning_direction": updated["next_tuning_direction"],
                "note": updated["human_friendly_note"],
            }
        )
    return summaries
