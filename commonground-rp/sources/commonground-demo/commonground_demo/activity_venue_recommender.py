from __future__ import annotations

from .models import Activity, User, Venue
from .passport_parser import activity_tags, venue_tags
from .utils import average, cosine_from_tags


def recommend_activity_venue(
    group: list[User],
    activities: list[Activity],
    venues: list[Venue],
    top_n: int = 4,
) -> list[tuple[Activity, Venue, str, dict[str, float]]]:
    feasible_events = []
    common_slots = common_availability(group)
    for activity in activities:
        activity_ok, activity_reason = activity_constraints_ok(group, activity)
        if not activity_ok:
            continue
        for venue in venues:
            venue_ok, venue_reason = venue_constraints_ok(group, activity, venue, common_slots)
            if not venue_ok:
                continue
            time_slot = first_matching_slot(common_slots, venue.available_slots)
            scores = rank_activity_venue(group, activity, venue)
            scores["constraint_fit"] = 1.0
            scores["activity_constraint_note"] = activity_reason
            scores["venue_constraint_note"] = venue_reason
            feasible_events.append((activity, venue, time_slot, scores))
    return sorted(feasible_events, key=lambda item: item[3]["activity_venue_score"], reverse=True)[:top_n]


def activity_constraints_ok(group: list[User], activity: Activity) -> tuple[bool, str]:
    size = len(group)
    if size not in activity.best_group_size:
        return False, "group size outside activity sweet spot"
    if not budgets_overlap(group, activity.budget_min, activity.budget_max):
        return False, "activity outside group budget overlap"
    alcohol_levels = {user.alcohol_comfort for user in group}
    if "none" in alcohol_levels and activity.alcohol_level != "none":
        return False, "activity conflicts with alcohol comfort"
    if any("loud bars" in user.awkwardness_triggers for user in group) and activity.category in {"cocktail"}:
        return False, "activity conflicts with loud venue trigger"
    return True, "activity satisfies group constraints"


def venue_constraints_ok(group: list[User], activity: Activity, venue: Venue, common_slots: set[str]) -> tuple[bool, str]:
    if activity.category not in venue.activity_categories:
        return False, "venue does not support activity category"
    if not (venue.capacity_min <= len(group) <= venue.capacity_max):
        return False, "venue capacity mismatch"
    if not common_slots & set(venue.available_slots):
        return False, "no shared time slot"
    if venue.neighborhood not in common_locations(group):
        return False, "venue outside shared location radius"
    if not venue.public_first and any("public venue first" in user.boundaries for user in group):
        return False, "public-first boundary mismatch"
    if venue.alcohol_heavy and any(user.alcohol_comfort == "none" for user in group):
        return False, "venue conflicts with alcohol comfort"
    if venue.noise_level == "loud" and any("loud bars" in user.awkwardness_triggers for user in group):
        return False, "venue conflicts with noise trigger"
    if not budgets_overlap(group, venue.price_per_head, venue.price_per_head):
        return False, "venue outside group budget overlap"
    return True, "venue satisfies time, location, budget, safety, and capacity constraints"


def rank_activity_venue(group: list[User], activity: Activity, venue: Venue) -> dict[str, float]:
    group_tags = set().union(*(user.tags for user in group))
    activity_similarity = cosine_from_tags(group_tags, activity_tags(activity))
    venue_similarity = cosine_from_tags(group_tags, venue_tags(venue))
    energy_fit = average([1.0 if user.social_energy in activity.best_for_energy else 0.70 for user in group])
    awkwardness_reduction = 1.0 - activity.awkwardness_risk
    venue_quality = venue.quality_score
    novelty = novelty_bonus(group, activity, venue)
    score = (
        0.25 * activity_similarity
        + 0.20 * venue_similarity
        + 0.18 * energy_fit
        + 0.17 * awkwardness_reduction
        + 0.12 * venue_quality
        + 0.08 * novelty
    )
    return {
        "activity_similarity": activity_similarity,
        "venue_similarity": venue_similarity,
        "energy_fit": energy_fit,
        "awkwardness_reduction": awkwardness_reduction,
        "venue_quality": venue_quality,
        "novelty_bonus": novelty,
        "activity_venue_score": score,
    }


def common_availability(group: list[User]) -> set[str]:
    slots = set(group[0].availability)
    for user in group[1:]:
        slots &= set(user.availability)
    return slots


def common_locations(group: list[User]) -> set[str]:
    locations = set(group[0].location_radius)
    for user in group[1:]:
        locations &= set(user.location_radius)
    return locations


def first_matching_slot(group_slots: set[str], venue_slots: list[str]) -> str:
    for slot in venue_slots:
        if slot in group_slots:
            return slot
    return sorted(group_slots)[0] if group_slots else "TBD"


def budgets_overlap(group: list[User], price_min: int, price_max: int) -> bool:
    lower = max(user.budget_min for user in group)
    upper = min(user.budget_max for user in group)
    return price_min <= upper and price_max >= lower


def novelty_bonus(group: list[User], activity: Activity, venue: Venue) -> float:
    repeated = 0
    for user in group:
        recent = set(user.vibe_profile.get("recent_vibes", []))
        if activity.category in recent:
            repeated += 1
        if venue.neighborhood in recent:
            repeated += 1
    return max(0.1, 1.0 - repeated / (len(group) * 3))
