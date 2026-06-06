from __future__ import annotations

from .models import User


def eligible_users(users: list[User], seed_user: User) -> tuple[list[User], dict[str, list[str]]]:
    eligible = []
    rejected = {}
    for user in users:
        reasons = rejection_reasons(user, seed_user)
        if reasons:
            rejected[user.user_id] = reasons
        else:
            eligible.append(user)
    return eligible, rejected


def rejection_reasons(user: User, seed_user: User) -> list[str]:
    reasons = []
    if not user.ntu_verified:
        reasons.append("NTU invite or community eligibility missing")
    if not user.identity_verified:
        reasons.append("identity not verified")
    if not user.admission_approved:
        reasons.append("admission not approved")
    if not user.safety_flags_clear:
        reasons.append("safety review required")
    if user.user_id != seed_user.user_id:
        if not set(user.availability) & set(seed_user.availability):
            reasons.append("no availability overlap")
        if not set(user.location_radius) & set(seed_user.location_radius):
            reasons.append("no location overlap")
        if not intents_compatible(seed_user.dating_intent, user.dating_intent):
            reasons.append("dating intent mismatch")
        if boundary_conflict(seed_user, user):
            reasons.append("boundary conflict")
    return reasons


def intents_compatible(a: str, b: str) -> bool:
    if a == b:
        return True
    flexible = {"open_to_meet", "friendship_first", "serious_dating"}
    if a in flexible and b in flexible:
        return not ({a, b} == {"friendship_first", "serious_dating"})
    return False


def boundary_conflict(a: User, b: User) -> bool:
    public_first = "public venue first"
    if public_first in a.boundaries and public_first not in b.boundaries:
        return True
    if public_first in b.boundaries and public_first not in a.boundaries:
        return True
    if a.alcohol_comfort == "none" and b.alcohol_comfort == "high":
        return True
    if b.alcohol_comfort == "none" and a.alcohol_comfort == "high":
        return True
    return False
