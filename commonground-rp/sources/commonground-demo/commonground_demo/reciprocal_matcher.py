from __future__ import annotations

import math

from .models import User
from .utils import clamp, cosine_from_tags


def acceptance_probability(viewer: User, candidate: User) -> float:
    similarity = cosine_from_tags(viewer.tags, candidate.tags)
    shared_topics = len(set(viewer.conversation_topics) & set(candidate.conversation_topics))
    shared_tastes = len(set(viewer.taste_clusters) & set(candidate.taste_clusters))
    energy_fit = 1.0 if viewer.social_energy == candidate.social_energy else 0.78
    if "low" in viewer.social_energy and "medium-high" in candidate.social_energy:
        energy_fit = 0.55
    if "medium-high" in viewer.social_energy and candidate.social_energy == "low":
        energy_fit = 0.62
    intent_fit = 0.9 if viewer.dating_intent == candidate.dating_intent else 0.76
    if {viewer.dating_intent, candidate.dating_intent} == {"friendship_first", "serious_dating"}:
        intent_fit = 0.35
    budget_fit = 1.0 - min(abs(mid_budget(viewer) - mid_budget(candidate)) / 3000, 0.5)
    score = (
        0.30 * similarity
        + 0.16 * min(shared_topics / 3, 1)
        + 0.14 * min(shared_tastes / 4, 1)
        + 0.16 * energy_fit
        + 0.14 * intent_fit
        + 0.10 * budget_fit
    )
    return clamp(score, 0.05, 0.98)


def reciprocal_score(a: User, b: User) -> float:
    return math.sqrt(acceptance_probability(a, b) * acceptance_probability(b, a))


def mid_budget(user: User) -> float:
    return (user.budget_min + user.budget_max) / 2
