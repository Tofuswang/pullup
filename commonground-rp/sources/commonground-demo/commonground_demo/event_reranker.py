from __future__ import annotations

from .models import Activity, EventPlan, User, Venue


def build_event_plans(
    candidate_groups: list[tuple[list[User], dict[str, float]]],
    activity_venue_options_by_group: list[list[tuple[Activity, Venue, str, dict[str, float]]]],
    top_n: int = 3,
) -> list[EventPlan]:
    plans: list[EventPlan] = []
    event_number = 1
    for (group, group_scores), options in zip(candidate_groups, activity_venue_options_by_group):
        for activity, venue, time_slot, av_scores in options:
            component_scores = combined_scores(group_scores, av_scores, group, activity, venue)
            final_score = component_scores["final_event_score"]
            event_id = f"e_{event_number:03d}"
            event_number += 1
            plans.append(
                EventPlan(
                    event_id=event_id,
                    group=group,
                    activity=activity,
                    venue=venue,
                    time_slot=time_slot,
                    component_scores=component_scores,
                    final_score=final_score,
                    why_this_group=why_group(group_scores, activity, venue),
                    learning_note=learning_note(group, activity, venue),
                )
            )
    return sorted(plans, key=lambda plan: plan.final_score, reverse=True)[:top_n]


def combined_scores(
    group_scores: dict[str, float],
    av_scores: dict[str, float],
    group: list[User],
    activity: Activity,
    venue: Venue,
) -> dict[str, float]:
    predicted_first_meeting_quality = (
        0.33 * group_scores["conversation_density"]
        + 0.23 * group_scores["mutual_acceptance"]
        + 0.17 * group_scores["logistics_fit"]
        + 0.17 * av_scores["activity_venue_score"]
        + 0.10 * group_scores["minimum_member_comfort"]
    )
    novelty_bonus = av_scores["novelty_bonus"]
    venue_quality = av_scores["venue_quality"]
    fairness_balance = group_scores["minimum_member_comfort"]
    safety_risk = 0.0 if venue.public_first else 0.2
    awkwardness_risk = (1.0 - av_scores["awkwardness_reduction"]) + group_scores["awkwardness_risk"]
    repeated_vibe_penalty = 1.0 - novelty_bonus
    final_event_score = (
        0.52 * predicted_first_meeting_quality
        + 0.12 * novelty_bonus
        + 0.12 * venue_quality
        + 0.10 * fairness_balance
        - 0.07 * safety_risk
        - 0.04 * awkwardness_risk
        - 0.03 * repeated_vibe_penalty
        + 0.12
    )
    return {
        "predicted_first_meeting_quality": predicted_first_meeting_quality,
        "conversation_density": group_scores["conversation_density"],
        "mutual_acceptance": group_scores["mutual_acceptance"],
        "logistics_fit": group_scores["logistics_fit"],
        "activity_affordance_fit": av_scores["activity_venue_score"],
        "minimum_member_comfort": group_scores["minimum_member_comfort"],
        "novelty_bonus": novelty_bonus,
        "venue_quality": venue_quality,
        "fairness_balance": fairness_balance,
        "safety_risk": safety_risk,
        "awkwardness_risk": awkwardness_risk,
        "repeated_vibe_penalty": repeated_vibe_penalty,
        "final_event_score": max(0.0, min(1.0, final_event_score)),
    }


def why_group(group_scores: dict[str, float], activity: Activity, venue: Venue) -> list[str]:
    reasons = []
    if group_scores["conversation_density"] > 0.45:
        reasons.append("high conversation density from overlapping AI, career, and city-culture topics")
    if group_scores["minimum_member_comfort"] > 0.55:
        reasons.append("minimum member comfort clears the room-quality threshold")
    if group_scores["diversity_of_perspectives"] > 0.55:
        reasons.append("enough perspective diversity to avoid a too-homogeneous room")
    reasons.append(f"{activity.name} creates a shared object, reducing awkwardness")
    reasons.append(f"{venue.name} satisfies public-first, budget, capacity, and location constraints")
    return reasons


def learning_note(group: list[User], activity: Activity, venue: Venue) -> str:
    hints = []
    if any("more energetic" in user.vibe_profile.get("preferred_energy", "") for user in group):
        hints.append("explore slightly more energetic venues")
    if any(activity.category in user.vibe_profile.get("recent_vibes", []) for user in group):
        hints.append("apply repeated-vibe penalty if this category repeats too often")
    if not hints:
        hints.append("use vibe feedback to decide whether to exploit this proven room type or explore an adjacent one")
    return "After feedback, the system may " + " and ".join(hints) + "."
