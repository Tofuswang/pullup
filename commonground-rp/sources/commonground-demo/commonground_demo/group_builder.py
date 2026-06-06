from __future__ import annotations

from itertools import combinations

from .models import User
from .reciprocal_matcher import reciprocal_score
from .utils import average, cosine_from_tags, pairwise


def build_candidate_groups(seed_user: User, candidates: list[User], target_size: int = 4, top_n: int = 3) -> list[tuple[list[User], dict[str, float]]]:
    groups: list[tuple[list[User], dict[str, float]]] = []
    pool = candidates[:]
    for first in pool[: min(len(pool), 6)]:
        group = consensus_aware_greedy_group(seed_user, first, pool, target_size)
        if len(group) == target_size:
            metrics = group_metrics(group)
            groups.append((group, metrics))

    unique = {}
    for group, metrics in groups:
        key = tuple(sorted(user.user_id for user in group))
        if key not in unique or metrics["group_utility"] > unique[key][1]["group_utility"]:
            unique[key] = (group, metrics)
    return sorted(unique.values(), key=lambda item: item[1]["group_utility"], reverse=True)[:top_n]


def consensus_aware_greedy_group(seed_user: User, first_candidate: User, candidates: list[User], target_size: int) -> list[User]:
    group = [seed_user, first_candidate]
    while len(group) < target_size:
        best_candidate = None
        best_gain = float("-inf")
        for candidate in candidates:
            if candidate in group:
                continue
            new_group = group + [candidate]
            if min_member_comfort(new_group) < 0.42:
                continue
            gain = group_utility(new_group) - group_utility(group)
            if gain > best_gain:
                best_gain = gain
                best_candidate = candidate
        if best_candidate is None:
            break
        group.append(best_candidate)
    return group


def group_metrics(group: list[User]) -> dict[str, float]:
    mutual_scores = [reciprocal_score(a, b) for a, b in pairwise(group)]
    topic_sets = [set(user.conversation_topics) for user in group]
    taste_sets = [set(user.taste_clusters) for user in group]
    shared_topic_density = average([len(a & b) / max(len(a | b), 1) for a, b in combinations(topic_sets, 2)])
    shared_taste_density = average([len(a & b) / max(len(a | b), 1) for a, b in combinations(taste_sets, 2)])
    embedding_density = average([cosine_from_tags(a.tags, b.tags) for a, b in pairwise(group)])
    conversation_density = min(1.0, 0.42 * embedding_density + 0.34 * shared_topic_density + 0.24 * shared_taste_density + 0.18)
    mutual_acceptance = average(mutual_scores)
    diversity = diversity_of_perspectives(group)
    logistics = logistics_fit(group)
    comfort = min_member_comfort(group)
    awkwardness = awkwardness_risk(group)
    utility = (
        0.28 * conversation_density
        + 0.22 * mutual_acceptance
        + 0.16 * logistics
        + 0.13 * diversity
        + 0.16 * comfort
        - 0.05 * awkwardness
    )
    return {
        "conversation_density": conversation_density,
        "mutual_acceptance": mutual_acceptance,
        "diversity_of_perspectives": diversity,
        "logistics_fit": logistics,
        "minimum_member_comfort": comfort,
        "awkwardness_risk": awkwardness,
        "group_utility": utility,
    }


def group_utility(group: list[User]) -> float:
    return group_metrics(group)["group_utility"]


def min_member_comfort(group: list[User]) -> float:
    comforts = []
    for user in group:
        pair_scores = [reciprocal_score(user, other) for other in group if other != user]
        energy_penalty = 0.0
        if user.social_energy == "low" and any(other.social_energy == "medium-high" for other in group):
            energy_penalty = 0.15
        comforts.append(max(0.0, average(pair_scores) - energy_penalty))
    return min(comforts) if comforts else 0.0


def logistics_fit(group: list[User]) -> float:
    availability = set(group[0].availability)
    locations = set(group[0].location_radius)
    for user in group[1:]:
        availability &= set(user.availability)
        locations &= set(user.location_radius)
    budget_spread = max(user.budget_max for user in group) - min(user.budget_min for user in group)
    budget_fit = 1.0 - min(budget_spread / 4000, 0.35)
    return min(1.0, 0.42 * bool(availability) + 0.38 * bool(locations) + 0.20 * budget_fit)


def diversity_of_perspectives(group: list[User]) -> float:
    career_count = len({user.career_cluster for user in group})
    topic_count = len({topic for user in group for topic in user.conversation_topics})
    return min(1.0, 0.55 * career_count / len(group) + 0.45 * topic_count / 12)


def awkwardness_risk(group: list[User]) -> float:
    triggers = [trigger for user in group for trigger in user.awkwardness_triggers]
    if any("forced networking" in trigger for trigger in triggers):
        return 0.22
    return 0.16
