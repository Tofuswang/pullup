from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class User:
    user_id: str
    name: str
    ntu_invite_code: str
    ntu_verified: bool
    identity_verified: bool
    admission_approved: bool
    safety_flags_clear: bool
    career_cluster: str
    community_context: str
    ai_passport_summary: str
    social_energy: str
    conversation_style: str
    taste_clusters: list[str]
    conversation_topics: list[str]
    awkwardness_triggers: list[str]
    dating_intent: str
    availability: list[str]
    budget_min: int
    budget_max: int
    preferred_group_size: int
    location_radius: list[str]
    boundaries: list[str]
    alcohol_comfort: str
    vibe_profile: dict[str, Any] = field(default_factory=dict)
    source_labels: dict[str, Any] = field(default_factory=dict)
    tags: set[str] = field(default_factory=set)
    embedding_text: str = ""


@dataclass
class Activity:
    activity_id: str
    name: str
    category: str
    affordance_tags: list[str]
    best_for_energy: list[str]
    awkwardness_risk: float
    intimacy_level: str
    alcohol_level: str
    budget_min: int
    budget_max: int
    duration_minutes: int
    best_group_size: list[int]
    embedding_text: str


@dataclass
class Venue:
    venue_id: str
    name: str
    neighborhood: str
    venue_type: str
    capacity_min: int
    capacity_max: int
    available_slots: list[str]
    price_per_head: int
    public_first: bool
    noise_level: str
    intimacy_level: str
    alcohol_heavy: bool
    quality_score: float
    vibe_tags: list[str]
    activity_categories: list[str]
    embedding_text: str


@dataclass
class Feedback:
    user_id: str
    attended: bool
    conversation_natural: float
    would_meet_similar: float
    activity_container_fit: float
    mutual_opt_in: bool
    no_safety_issue: bool
    energy_feedback: str
    tune_next: str
    notes: str


@dataclass
class EventPlan:
    event_id: str
    group: list[User]
    activity: Activity
    venue: Venue
    time_slot: str
    component_scores: dict[str, float]
    final_score: float
    why_this_group: list[str]
    learning_note: str
