from __future__ import annotations

from .models import Activity, User, Venue
from .utils import tokenize


def enrich_user_passports(users: list[User]) -> list[User]:
    for user in users:
        text = " ".join(
            [
                user.career_cluster,
                user.community_context,
                user.ai_passport_summary,
                user.social_energy,
                user.conversation_style,
                " ".join(user.taste_clusters),
                " ".join(user.conversation_topics),
                " ".join(user.location_radius),
                user.dating_intent,
            ]
        )
        user.embedding_text = text
        user.tags = tokenize(text)
    return users


def activity_tags(activity: Activity) -> set[str]:
    return tokenize(
        " ".join(
            [
                activity.name,
                activity.category,
                " ".join(activity.affordance_tags),
                activity.intimacy_level,
                activity.alcohol_level,
                activity.embedding_text,
            ]
        )
    )


def venue_tags(venue: Venue) -> set[str]:
    return tokenize(
        " ".join(
            [
                venue.name,
                venue.neighborhood,
                venue.venue_type,
                venue.noise_level,
                venue.intimacy_level,
                " ".join(venue.vibe_tags),
                venue.embedding_text,
            ]
        )
    )


def summarize_passport_before_after(user: User) -> dict:
    return {
        "before_ai_import": {
            "community_eligible": user.ntu_verified,
            "identity_verified": user.identity_verified,
            "career_cluster": user.career_cluster,
            "dating_intent": user.dating_intent,
            "availability": user.availability,
            "consented_linkedin_url": user.source_labels.get("linkedin_profile_url"),
            "linkedin_usage": user.source_labels.get("linkedin_usage", "verification/context only"),
        },
        "after_ai_import_and_redaction": {
            "social_energy": user.social_energy,
            "conversation_style": user.conversation_style,
            "taste_clusters": user.taste_clusters,
            "conversation_topics": user.conversation_topics,
            "awkwardness_triggers": user.awkwardness_triggers,
            "redaction_note": "Raw AI conversations stay outside CommonGround; only this user-approved Passport is imported.",
        },
    }
