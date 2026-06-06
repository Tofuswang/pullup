from __future__ import annotations

from .models import User
from .utils import cosine_from_tags


def retrieve_candidates(seed_user: User, eligible: list[User], limit: int = 8) -> list[tuple[User, float]]:
    scored = []
    for user in eligible:
        if user.user_id == seed_user.user_id:
            continue
        similarity = cosine_from_tags(seed_user.tags, user.tags)
        topic_overlap = len(set(seed_user.conversation_topics) & set(user.conversation_topics))
        taste_overlap = len(set(seed_user.taste_clusters) & set(user.taste_clusters))
        retrieval_score = min(1.0, similarity + 0.04 * topic_overlap + 0.03 * taste_overlap)
        scored.append((user, retrieval_score))
    return sorted(scored, key=lambda item: item[1], reverse=True)[:limit]
