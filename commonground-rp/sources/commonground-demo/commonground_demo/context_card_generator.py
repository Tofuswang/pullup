from __future__ import annotations

from .models import EventPlan, User


def generate_context_card(plan: EventPlan, viewer: User | None = None) -> dict:
    common_topics = top_common_topics(plan.group)
    participant_snapshots = [
        f"{user.career_cluster} / {user.conversation_style}; open to {', '.join(user.conversation_topics[:2])}"
        for user in plan.group
    ]
    prompts = warmup_prompts(common_topics, plan.activity.category)
    return {
        "event_title": f"{plan.activity.name}: {theme(plan.group)}",
        "time": plan.time_slot,
        "venue": f"{plan.venue.name}, {plan.venue.neighborhood}",
        "group_size": len(plan.group),
        "why_this_room": plan.why_this_group,
        "shared_context": common_topics,
        "participant_snapshots": participant_snapshots,
        "warm_up_prompts": prompts,
        "boundaries": [
            "Public venue first.",
            "No forced contact exchange.",
            "Contact exchange only happens with mutual opt-in after the event.",
            "Raw AI summaries, dating intent, and private details are never shown to other participants.",
        ],
        "mutual_confirm": {
            "status": "pending",
            "rule": "Group happens only if enough participants opt in after previewing this Context Card.",
        },
    }


def top_common_topics(group: list[User]) -> list[str]:
    counts: dict[str, int] = {}
    for user in group:
        for topic in user.conversation_topics + user.taste_clusters:
            counts[topic] = counts.get(topic, 0) + 1
    ranked = sorted(counts.items(), key=lambda item: (-item[1], item[0]))
    return [topic for topic, _ in ranked[:5]]


def theme(group: list[User]) -> str:
    careers = sorted({user.career_cluster for user in group})
    if "finance" in careers and ("tech" in careers or "product" in careers or "data" in careers):
        return "Finance x AI-curious"
    if "creative" in careers:
        return "Culture x thoughtful operators"
    return "NTU thoughtful small-group room"


def warmup_prompts(common_topics: list[str], activity_category: str) -> list[str]:
    first = activity_category if activity_category in {"gallery", "matcha", "expo", "bookstore", "pottery", "scent"} else (common_topics[0] if common_topics else "work and city life")
    prompts = [
        f"What is one thing about {first} you wish more people talked about honestly?",
        "What kind of city place makes you feel most like yourself?",
        "What is a conversation you enjoy but rarely get to have?",
    ]
    if activity_category in {"matcha", "bookstore", "gallery"}:
        prompts[1] = "What makes a cafe, gallery, or bookstore feel easy to spend time in?"
    if activity_category == "expo":
        prompts[0] = "What technology shift feels real to you this year, not just hype?"
    return prompts
