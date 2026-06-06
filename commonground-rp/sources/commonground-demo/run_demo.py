from __future__ import annotations

import json

from commonground_demo.activity_venue_recommender import recommend_activity_venue
from commonground_demo.candidate_retriever import retrieve_candidates
from commonground_demo.context_card_generator import generate_context_card
from commonground_demo.data import load_activities, load_feedback, load_users, load_venues
from commonground_demo.eligibility_gate import eligible_users
from commonground_demo.event_reranker import build_event_plans
from commonground_demo.feedback_updater import summarize_feedback_learning, update_vibe_profile
from commonground_demo.group_builder import build_candidate_groups
from commonground_demo.passport_parser import enrich_user_passports, summarize_passport_before_after
from commonground_demo.reciprocal_matcher import acceptance_probability, reciprocal_score
from commonground_demo.spectrum_delivery_adapter import build_imessage_onboarding_flow, build_spectrum_delivery_plan


def main() -> None:
    users = enrich_user_passports(load_users())
    activities = load_activities()
    venues = load_venues()
    feedback = load_feedback()
    seed_user = users[0]

    print_header("CommonGround")
    print("CommonGround is not a matching score. It is a recommender system for designing the first hour.")
    print("We do not recommend people. We recommend a room: the people, the activity, the venue, and the context.")
    print("All values in this demo are first-pass product heuristics, not validated empirical coefficients.")

    print_header("0. Photon iMessage Guided Onboarding")
    print_json(build_imessage_onboarding_flow())

    print_header("1. Claim Invite + Verify")
    print_json(
        {
            "invite_code": seed_user.ntu_invite_code,
            "community_eligible": seed_user.ntu_verified,
            "identity_verified": seed_user.identity_verified,
            "community_context": seed_user.community_context,
            "consented_linkedin_url": seed_user.source_labels.get("linkedin_profile_url"),
            "linkedin_usage": seed_user.source_labels.get("linkedin_usage"),
            "pitch_line": "Verification gives us trust and context. It does not define the person.",
        }
    )

    print_header("2. Import + Redact CommonGround Passport")
    print_json(summarize_passport_before_after(seed_user))

    print_header("2b. User Input To Matching Profile")
    print_json(
        {
            "workflow": [
                "Photon iMessage collects explicit consent.",
                "LinkedIn URL verifies true-person identity only.",
                "User generates AI Passport in their everyday AI.",
                "User pastes AI Passport into iMessage.",
                "User redacts/deletes sensitive content.",
                "User enters explicit preferences that should never be inferred.",
                "CommonGround normalizes approved text into structured matching signals.",
                "User confirms the limited matching profile.",
                "RoomTAIRA uses only the confirmed profile, not raw LinkedIn facts or raw AI chats.",
            ],
            "linkedin_fields_used": {
                "identity_verified": seed_user.identity_verified,
                "linkedin_url": seed_user.source_labels.get("linkedin_profile_url"),
                "usage": "true-person verification only",
            },
            "matching_profile_from_ai_passport": {
                "social_energy": seed_user.social_energy,
                "conversation_style": seed_user.conversation_style,
                "taste_clusters": seed_user.taste_clusters,
                "conversation_topics": seed_user.conversation_topics,
                "awkwardness_triggers": seed_user.awkwardness_triggers,
            },
            "matching_profile_from_self_input": {
                "dating_intent": seed_user.dating_intent,
                "availability": seed_user.availability,
                "budget_range": [seed_user.budget_min, seed_user.budget_max],
                "location_radius": seed_user.location_radius,
                "alcohol_comfort": seed_user.alcohol_comfort,
                "preferred_group_size": seed_user.preferred_group_size,
                "boundaries": seed_user.boundaries,
            },
            "privacy_boundary": "Other members see only the Context Card, never the LinkedIn URL, raw Passport, dating intent, contact info, or internal scores.",
        }
    )

    print_header("3. Eligibility Gate")
    eligible, rejected = eligible_users(users, seed_user)
    print_json(
        {
            "hard_gate_principle": "Safety, identity, consent, availability, and boundaries are hard gates before recommendation begins.",
            "eligible_count": len(eligible),
            "rejected_count": len(rejected),
            "rejected_examples": rejected,
        }
    )

    print_header("4. Candidate Retrieval")
    retrieved = retrieve_candidates(seed_user, eligible, limit=8)
    print_json(
        [
            {
                "user_id": user.user_id,
                "name": user.name,
                "career_cluster": user.career_cluster,
                "retrieval_score": round(score, 3),
                "embedding_text": user.embedding_text,
            }
            for user, score in retrieved
        ]
    )

    print_header("5. Reciprocal Person Matching")
    reciprocal_examples = []
    for user, _ in retrieved[:5]:
        reciprocal_examples.append(
            {
                "pair": f"{seed_user.user_id}-{user.user_id}",
                f"P({seed_user.name}_accepts_{user.name})": round(acceptance_probability(seed_user, user), 3),
                f"P({user.name}_accepts_{seed_user.name})": round(acceptance_probability(user, seed_user), 3),
                "reciprocal_score": round(reciprocal_score(seed_user, user), 3),
            }
        )
    print_json(
        {
            "principle": "A movie does not reject you. A person can. We use reciprocal recommendation.",
            "formula": "sqrt(P(A accepts B) * P(B accepts A))",
            "examples": reciprocal_examples,
        }
    )

    print_header("6. Consensus-Aware Group Formation")
    candidate_people = [user for user, _ in retrieved]
    groups = build_candidate_groups(seed_user, candidate_people, target_size=4, top_n=3)
    print_json(
        [
            {
                "group": [f"{user.user_id}:{user.name}" for user in group],
                "group_utility": round(metrics["group_utility"], 3),
                "conversation_density": round(metrics["conversation_density"], 3),
                "mutual_acceptance": round(metrics["mutual_acceptance"], 3),
                "minimum_member_comfort": round(metrics["minimum_member_comfort"], 3),
                "diversity_of_perspectives": round(metrics["diversity_of_perspectives"], 3),
            }
            for group, metrics in groups
        ]
    )

    print_header("7. Activity / Venue Recommendation + Re-Ranking")
    options_by_group = [recommend_activity_venue(group, activities, venues, top_n=4) for group, _ in groups]
    plans = build_event_plans(groups, options_by_group, top_n=3)
    print_json(
        [
            {
                "event_id": plan.event_id,
                "group": [user.user_id for user in plan.group],
                "activity": plan.activity.name,
                "venue": f"{plan.venue.name}, {plan.venue.neighborhood}",
                "time": plan.time_slot,
                "first_meeting_quality": round(plan.component_scores["predicted_first_meeting_quality"], 3),
                "final_event_score": round(plan.final_score, 3),
                "why_this_group": plan.why_this_group,
                "learning_note": plan.learning_note,
            }
            for plan in plans
        ]
    )

    print_header("8. Context Cards")
    context_cards = []
    for plan in plans:
        card = generate_context_card(plan)
        context_cards.append(card)
        print(f"\n--- {plan.event_id} ---")
        print_json(card)

    print_header("9. Photon Spectrum Delivery Layer")
    print_json(
        {
            "principle": "Do not reinvent iMessage, WhatsApp, Telegram, or Slack plumbing. CommonGround hands the recommended room and Context Card to Photon Spectrum.",
            "official_claim_used_in_plan": "Photon Spectrum connects agents to iMessage, WhatsApp, Telegram, Slack, and other everyday channels, with unified API, message history, audit logs, and human-in-the-loop controls.",
            "delivery_payload_for_top_event": build_spectrum_delivery_plan(plans[0], context_cards[0]) if plans else {},
        }
    )

    print_header("10. Post-Event Vibe Feedback Learning")
    print_json(
        {
            "principle": "Feedback tunes future recommendations; it does not rate humans like products.",
            "reward_formula": "0.25 attended + 0.25 natural conversation + 0.20 similar vibe again + 0.15 activity container + 0.10 mutual opt-in + 0.05 no safety issue",
            "learning_examples": summarize_feedback_learning(users, feedback),
        }
    )

    print_header("11. Before Feedback -> After Feedback Example")
    example_feedback = feedback[0]
    user_before = load_users()[0]
    before = user_before.vibe_profile
    after = update_vibe_profile(seed_user, example_feedback)
    print_json(
        {
            "user": seed_user.user_id,
            "before": before,
            "feedback": {
                "conversation_natural": example_feedback.conversation_natural,
                "would_meet_similar": example_feedback.would_meet_similar,
                "activity_container_fit": example_feedback.activity_container_fit,
                "energy_feedback": example_feedback.energy_feedback,
                "tune_next": example_feedback.tune_next,
            },
            "after": after,
            "result": "The next recommendation keeps the AI x career conversation cluster but explores a slightly more energetic room.",
        }
    )

    print_header("Judge Answer")
    print(
        "For MVP, we use RoomTAIRA, a TAIRA-inspired thought-augmented room recommender. The agentic layer interprets fuzzy social intent "
        "and decomposes it into people retrieval, reciprocal matching, room formation, activity selection, venue constraints, safety critique, "
        "and Context Card generation. We do not build the channel layer ourselves: Photon Spectrum delivers the agent experience through "
        "iMessage and other everyday channels with message history, audit logs, and human-in-the-loop controls. The feedback layer follows "
        "contextual-bandit logic to balance repeating proven vibes with exploring adjacent ones."
    )


def print_header(title: str) -> None:
    print("\n" + "=" * 88)
    print(title)
    print("=" * 88)


def print_json(value) -> None:
    print(json.dumps(value, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
