from __future__ import annotations

from .models import EventPlan


def build_imessage_onboarding_flow() -> dict:
    return {
        "delivery_provider": "Photon Spectrum",
        "primary_channel": "iMessage",
        "purpose": "Guide the user from consent to a verified, user-approved matching profile. LinkedIn verifies real-person identity only; AI Passport and self input create the taste graph.",
        "source": "https://photon.codes/",
        "data_boundary": {
            "linkedin_role": "True-person verification only. CommonGround stores the consented URL/verification status, not scraped profile facts.",
            "ai_passport_role": "User-approved personality, taste, social energy, conversation style, and first-meeting preferences.",
            "self_input_role": "Explicit facts that should never be inferred: intent, availability, budget, location radius, alcohol comfort, group size, and contact boundaries.",
            "final_profile_rule": "The matching profile is generated only after user redaction and final approval.",
        },
        "human_in_the_loop": {
            "enabled": True,
            "review_triggers": [
                "user asks what data is visible",
                "user pastes sensitive data",
                "verification confidence is low",
                "user reports safety concern",
                "user wants manual edit before import",
            ],
        },
        "messages": [
            {
                "step": "invite_opening",
                "copy": "You are one of a small first circle invited to CommonGround: a private NTU-origin room network for meeting thoughtful people offline. We do not do swiping. We design a room worth showing up for.",
                "expected_user_input": "START",
            },
            {
                "step": "consent",
                "copy": "To keep the room trusted, reply CONSENT if we may verify you are a real person and help you build a private matching profile from only what you approve. We will not scrape LinkedIn, read raw AI chats, or show raw AI text to other members.",
                "expected_user_input": "CONSENT",
            },
            {
                "step": "linkedin_verification",
                "copy": "Step 1/5: paste your LinkedIn profile URL. We use it only as true-person verification, not as your personality or dating profile. Example: https://www.linkedin.com/in/fu-syuan-wang-7719111a9/",
                "expected_user_input": "LinkedIn profile URL",
            },
            {
                "step": "ai_passport_prompt",
                "copy": "Step 2/5: open your everyday AI and paste this prompt: 'Summarize me for a vetted offline social app. Include my social energy, conversation style, interests, good first-meet settings, topics I enjoy, awkwardness triggers, and boundaries. Exclude secrets, exact address, income, phone number, health details, and anything sensitive. Return JSON.' Then paste the result here.",
                "expected_user_input": "User-approved AI Passport JSON/text",
            },
            {
                "step": "redaction",
                "copy": "Step 3/5: review what you pasted. Reply DELETE followed by anything you want removed, or reply APPROVE PASSPORT when it is safe to convert into matching signals.",
                "expected_user_input": "DELETE ... or APPROVE PASSPORT",
            },
            {
                "step": "explicit_preferences",
                "copy": "Step 4/5: answer the details we should never infer: dating intent, available times, budget range, neighborhood radius, alcohol comfort, preferred group size, and contact-exchange boundary. You can answer in one message.",
                "expected_user_input": "Preference text",
            },
            {
                "step": "preview",
                "copy": "Step 5/5: I will show you a plain-language preview of your matching profile. No JSON, no internal scores. Reply APPROVE if it feels right, or EDIT followed by what you want changed. Other members will not see your raw AI Passport, LinkedIn URL, dating intent, or contact info.",
                "expected_user_input": "CONFIRM",
            },
        ],
        "structured_profile_created_after_confirmation": {
            "verification": ["identity_verified", "linkedin_url_hash_or_handle", "community_eligible"],
            "ai_passport_signals": ["social_energy", "conversation_style", "taste_clusters", "conversation_topics", "awkwardness_triggers"],
            "self_input_signals": ["dating_intent", "availability", "budget_range", "location_radius", "alcohol_comfort", "preferred_group_size", "boundaries"],
            "used_by_recommender": ["eligibility gate", "candidate retrieval", "room formation", "activity/venue recommendation", "Context Card generation"],
            "never_shared_to_other_members": ["LinkedIn URL", "raw AI Passport", "dating intent", "contact info", "internal scores"],
        },
        "spectrum_runtime_mapping": {
            "message_stream": "Every inbound user message arrives as [space, message] from app.messages.",
            "space": "The active iMessage DM or group conversation. CommonGround sends replies through space.send(...) and uses space.responding(...) for typing indicators.",
            "message": "The user input. CommonGround narrows on message.content.type before handling text, attachments, voice notes, poll votes, or replies.",
            "user": "The sender. Memory is scoped per verified person, not globally.",
            "state_machine": [
                "invited",
                "consented",
                "linkedin_received",
                "passport_received",
                "passport_approved",
                "preferences_received",
                "profile_approved",
                "room_recommended",
                "mutual_confirm_pending",
                "event_confirmed",
                "feedback_collected",
            ],
        },
        "imessage_native_features": {
            "typing_indicators": "Use space.responding(...) while RoomTAIRA generates profile previews or Context Cards.",
            "tapbacks": "Use iMessage tapbacks for lightweight acknowledgement after START, CONSENT, and APPROVE.",
            "polls": "Use Spectrum poll content for YES / MAYBE / SKIP when supported; otherwise use text fallback.",
            "threaded_replies": "Use message.reply(...) for clarification questions tied to a specific user input.",
            "group_creation": "After enough users mutually confirm, use the iMessage provider space(...) API to create the event group.",
            "group_rename": "Rename the group chat to the room title, such as 'CommonGround: Gallery + Tea'.",
            "contact_card": "After first exchange, send a CommonGround contact card so the line becomes a known contact.",
        },
        "deliverability_rules": {
            "inbound_first": "User should initiate by tapping a prefilled iMessage link and sending START. Avoid cold outbound first messages.",
            "first_message": "Text only; no links or media in the first message.",
            "followups": "Cap non-responder followups at 2-3, spaced across days.",
            "pacing": "Pace messages naturally and debounce bursts instead of replying to each fragment.",
            "capacity": "Track per-server and per-line volume; stop assigning new users near 70-80% utilization.",
        },
        "reliability_rules": {
            "debounce": "Batch bursty messages into one turn before running RoomTAIRA.",
            "cancellation": "Cancel in-flight generation when a newer user message arrives.",
            "carry_forward": "If a job is cancelled after draining queued messages, carry them forward into the next batch.",
            "idempotency": "Use stable clientGuid values for multi-message sends so retries do not duplicate iMessages.",
            "resume_cursor": "Persist startIndex on send jobs so retries resume after already-sent messages.",
            "memory_scope": "Scope memory by resourceId = verified user address and threadId = chat id.",
            "failure_audit": "Record failed jobs with stage, payload pointer, and error for human review.",
        },
    }


def build_user_friendly_profile_preview(user_profile: dict) -> str:
    return "\n".join(
        [
            "Here is how CommonGround understands your first-meet style:",
            "",
            "You seem like someone who enjoys thoughtful, curious conversation in small, low-pressure groups. You like ideas, city life, cafes, books, AI/product conversations, and activities that give people something natural to talk about.",
            "",
            "Best first-meet settings for you:",
            "- Coffee, tea, or dessert in a calm place",
            "- Bookstore plus cafe",
            "- Gallery or neighborhood walk",
            "- Small AI/product mini-salon",
            "- Structured small-group activity",
            "",
            "We should avoid:",
            "- Loud bars, clubs, or chaotic parties",
            "- Alcohol-centered first meetings",
            "- High-pressure networking energy",
            "- Overly intense one-on-one first meetings",
            "- People who dominate without curiosity",
            "",
            "Your boundaries:",
            "- Public setting first",
            "- Small group format",
            "- Clear time and place",
            "- No pressure to extend the meetup",
            "- Keep communication in-app first",
            "- Exchange personal contact only after mutual comfort",
            "",
            "Other members will not see your raw AI Passport, LinkedIn URL, dating intent, contact info, or internal scores. They will only see a short Context Card for a specific room.",
            "",
            "Reply APPROVE if this feels right, or EDIT followed by what you want changed.",
        ]
    )


def build_spectrum_delivery_plan(plan: EventPlan, context_card: dict) -> dict:
    """Prepare the payload CommonGround would hand to Photon Spectrum.

    We do not implement iMessage, WhatsApp, Telegram, or Slack transport here.
    Photon Spectrum owns channel delivery, message history, audit logs, and
    human-in-the-loop controls. CommonGround owns the room recommendation and
    the privacy-safe Context Card payload.
    """
    return {
        "delivery_provider": "Photon Spectrum",
        "why_not_build_channel_layer": "Spectrum already connects agents to iMessage, WhatsApp, Telegram, Slack, and other everyday channels through a unified API.",
        "source": "https://photon.codes/",
        "channel_strategy": {
            "primary": "iMessage",
            "fallbacks": ["WhatsApp Business", "Terminal demo provider", "future custom providers"],
            "routing_rule": "Use the participant's preferred available channel; fall back automatically if iMessage delivery is unavailable.",
        },
        "spectrum_primitives": {
            "Message": "Inbound content from iMessage, WhatsApp Business, terminal, or a custom provider.",
            "Space": "Conversation context. Send Context Cards, polls, replies, typing indicators, and group updates through this.",
            "User": "Participant identity on the provider, resolved by phone/email for iMessage.",
            "Provider": "iMessage first, terminal for local demo, WhatsApp Business for cross-platform fallback.",
        },
        "controls": {
            "message_history": True,
            "audit_logs": True,
            "human_in_the_loop_review": True,
            "human_review_triggers": [
                "safety escalation",
                "ambiguous consent response",
                "participant asks to edit or redact context",
                "delivery failure before event confirmation",
            ],
        },
        "outbound_messages": [
            {
                "type": "context_card",
                "channel_component": "rich message",
                "title": context_card["event_title"],
                "body": {
                    "time": context_card["time"],
                    "venue": context_card["venue"],
                    "why_this_room": context_card["why_this_room"],
                    "shared_context": context_card["shared_context"],
                    "warm_up_prompts": context_card["warm_up_prompts"],
                    "boundaries": context_card["boundaries"],
                },
            },
            {
                "type": "mutual_confirm_poll",
                "channel_component": "Spectrum poll content when supported; text fallback otherwise",
                "question": "Are you in for this CommonGround room?",
                "options": ["Yes", "Maybe", "Skip"],
                "confirmation_rule": context_card["mutual_confirm"]["rule"],
            },
            {
                "type": "event_group_creation",
                "channel_component": "iMessage group space",
                "when": "Only after enough participants opt in.",
                "post_creation_actions": [
                    "send short welcome",
                    "rename group to room title",
                    "send Context Card summary",
                    "send event boundary reminder",
                ],
            },
        ],
        "privacy_contract": {
            "send_to_spectrum": [
                "event title",
                "time",
                "venue",
                "limited Context Card",
                "mutual confirm options",
            ],
            "do_not_send_to_spectrum": [
                "raw AI conversations",
                "unredacted Passport",
                "private safety notes",
                "dating intent unless explicitly needed for user-facing copy",
                "internal scoring features",
            ],
        },
    }
