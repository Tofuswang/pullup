export type ImplementationStatus = "implemented_mvp" | "planned_native" | "out_of_scope";

export type ProductSurface = {
  id: string;
  label: string;
  role: string;
  status: ImplementationStatus;
  currentCode?: string[];
};

export type PermissionTier = {
  id: string;
  label: string;
  dataUsed: string[];
  status: ImplementationStatus;
  fallback: string;
};

export type ConsentLedgerEntry = {
  userId: string;
  source: "linkedin" | "ai_passport" | "manual_availability" | "local_calendar" | "maps" | "feedback";
  consentedAt: string;
  expiresAt?: string;
  dataCategories: string[];
  revocable: true;
  rawDataStored: false;
};

export type MeetingOutcomeFeedback = {
  attended: boolean;
  conversationFeltNatural: boolean;
  wouldMeetSimilarPeopleAgain: boolean;
  activityWasGoodContainer: boolean;
  mutualOptInOccurred: boolean;
  noSafetyIssue: boolean;
};

export type MeetingOutcomeScore = {
  reward: number;
  meaningfulSecondInteractionSignal: boolean;
};

export type MethodologyCoverageItem = {
  requirement: string;
  status: ImplementationStatus;
  evidence: string[];
  gap?: string;
};

export const productSurfaces: ProductSurface[] = [
  {
    id: "ios_app_brain",
    label: "Full iOS app as assistant brain",
    role: "Native permissions, durable memory, local AI, EventKit, MapKit, and account settings.",
    status: "planned_native",
    currentCode: ["docs/ios-local-integrations.md"],
  },
  {
    id: "imessage_surface",
    label: "iMessage proposal and confirmation surface",
    role: "Conversational onboarding, Context Cards, RSVP, manual availability, and confirmation handoff.",
    status: "implemented_mvp",
    currentCode: ["src/index.ts", "src/agent.ts", "src/commonground.ts"],
  },
  {
    id: "app_intents_shortcuts",
    label: "App Intents / Shortcuts entry points",
    role: "Future Siri, Spotlight, and automation triggers.",
    status: "planned_native",
  },
  {
    id: "web_fallback",
    label: "Web fallback for friends without the app",
    role: "Manual RSVP, free-window sharing, and consent for non-installed friends.",
    status: "planned_native",
  },
];

export const permissionLadder: PermissionTier[] = [
  {
    id: "linkedin_verification",
    label: "LinkedIn verification handle",
    dataUsed: ["profile URL only"],
    status: "implemented_mvp",
    fallback: "Manual review or NTU invite code.",
  },
  {
    id: "ai_passport",
    label: "User-approved AI Passport",
    dataUsed: ["user-redacted summary", "taste signals", "conversation style", "boundaries"],
    status: "implemented_mvp",
    fallback: "Short self-input questionnaire.",
  },
  {
    id: "manual_availability",
    label: "Manual local-calendar free windows",
    dataUsed: ["free windows only", "no event titles"],
    status: "implemented_mvp",
    fallback: "User replies with rough windows in iMessage.",
  },
  {
    id: "apple_calendar_write_only",
    label: "Apple Calendar write-only event creation",
    dataUsed: ["confirmed event details only"],
    status: "implemented_mvp",
    fallback: "iMessage calendar-ready event card.",
  },
  {
    id: "apple_calendar_full_access",
    label: "Apple Calendar full access for conflict detection",
    dataUsed: ["free/busy derived on device"],
    status: "planned_native",
    fallback: "Manual availability sharing.",
  },
  {
    id: "maps_location",
    label: "Maps and rough location anchors",
    dataUsed: ["venue query", "rough neighborhood", "ephemeral current location"],
    status: "implemented_mvp",
    fallback: "Apple Maps URL search and user-shared location in Messages.",
  },
  {
    id: "post_event_feedback",
    label: "Post-event vibe feedback",
    dataUsed: ["structured vibe outcome", "safety review flag"],
    status: "implemented_mvp",
    fallback: "One-tap or plain-text reflection.",
  },
];

export function buildConsentLedgerEntry(
  input: Omit<ConsentLedgerEntry, "consentedAt" | "revocable" | "rawDataStored"> & {
    consentedAt?: Date;
  },
): ConsentLedgerEntry {
  return {
    ...input,
    consentedAt: (input.consentedAt ?? new Date()).toISOString(),
    revocable: true,
    rawDataStored: false,
  };
}

export function scoreMeetingOutcomeFeedback(
  feedback: MeetingOutcomeFeedback,
): MeetingOutcomeScore {
  const reward =
    (feedback.attended ? 0.25 : 0) +
    (feedback.conversationFeltNatural ? 0.25 : 0) +
    (feedback.wouldMeetSimilarPeopleAgain ? 0.2 : 0) +
    (feedback.activityWasGoodContainer ? 0.15 : 0) +
    (feedback.mutualOptInOccurred ? 0.1 : 0) +
    (feedback.noSafetyIssue ? 0.05 : 0);

  return {
    reward: Math.round(reward * 100) / 100,
    meaningfulSecondInteractionSignal:
      feedback.attended &&
      feedback.noSafetyIssue &&
      (feedback.wouldMeetSimilarPeopleAgain || feedback.mutualOptInOccurred),
  };
}

export function methodologyCoverage(): MethodologyCoverageItem[] {
  return [
    {
      requirement: "Four-surface architecture with iOS app brain, iMessage surface, App Intents, and web fallback",
      status: "implemented_mvp",
      evidence: ["productSurfaces"],
      gap: "Only the iMessage/Spectrum surface exists in this repo; native iOS and web fallback are mapped for implementation.",
    },
    {
      requirement: "Minimum viable permissions and revocable consent",
      status: "implemented_mvp",
      evidence: ["permissionLadder", "buildConsentLedgerEntry"],
    },
    {
      requirement: "Deterministic scheduling truth, not AI guessing",
      status: "implemented_mvp",
      evidence: [
        "parseAvailabilityWindows",
        "findMutualSlots",
        "formatIphoneCalendarEventCard",
        "EventKitCalendarWriter",
      ],
      gap: "Full-access EventKit free/busy conflict detection still requires the complete iOS app target.",
    },
    {
      requirement: "AI-driven explanation, memory, and social orchestration",
      status: "implemented_mvp",
      evidence: ["parseResearchProfile", "recommendRoom", "contextCard"],
      gap: "Current model is first-pass heuristic, not trained ML or on-device Foundation Models.",
    },
    {
      requirement: "Research-backed chemistry without destiny claims",
      status: "implemented_mvp",
      evidence: ["dyadicChemistry", "groupDynamics", "experienceFit", "methodologyNotes"],
    },
    {
      requirement: "Measure meaningful second interaction instead of message volume",
      status: "implemented_mvp",
      evidence: ["scoreMeetingOutcomeFeedback"],
      gap: "No persistent analytics pipeline yet.",
    },
  ];
}
