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

export type MeetingOutcomeMetricRecord = {
  id: string;
  roomId: string;
  cohortId?: string;
  recordedAt: string;
  participantCount: number;
  reward: number;
  meaningfulSecondInteractionSignal: boolean;
  signalVersion: "demo_v1";
  rawFeedbackStored: false;
};

export type MeetingOutcomeAnalyticsEvent = {
  name: "meeting_outcome_scored";
  metricId: string;
  roomId: string;
  cohortId?: string;
  reward: number;
  meaningfulSecondInteractionSignal: boolean;
  recordedAt: string;
};

export type MeetingOutcomeMetricStore = {
  save(record: MeetingOutcomeMetricRecord): void;
  list(): MeetingOutcomeMetricRecord[];
};

export type MeetingOutcomeAnalyticsSink = {
  track(event: MeetingOutcomeAnalyticsEvent): void;
};

export type MeetingOutcomeMetricInput = {
  metricId?: string;
  roomId: string;
  cohortId?: string;
  participantIds: string[];
  feedback: MeetingOutcomeFeedback;
  recordedAt?: Date;
};

export type MeetingOutcomeMetricsSummary = {
  recordedRooms: number;
  meaningfulSecondInteractionRate: number;
  averageReward: number;
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

export class DemoMeetingOutcomeMetricStore implements MeetingOutcomeMetricStore {
  private readonly records = new Map<string, MeetingOutcomeMetricRecord>();

  save(record: MeetingOutcomeMetricRecord): void {
    this.records.set(record.id, record);
  }

  list(): MeetingOutcomeMetricRecord[] {
    return [...this.records.values()].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  }
}

export class DemoMeetingOutcomeAnalyticsSink implements MeetingOutcomeAnalyticsSink {
  private readonly events: MeetingOutcomeAnalyticsEvent[] = [];

  track(event: MeetingOutcomeAnalyticsEvent): void {
    this.events.push(event);
  }

  list(): MeetingOutcomeAnalyticsEvent[] {
    return [...this.events];
  }
}

export class MeetingOutcomeMetricsPipeline {
  constructor(
    private readonly store: MeetingOutcomeMetricStore,
    private readonly analytics: MeetingOutcomeAnalyticsSink,
  ) {}

  record(input: MeetingOutcomeMetricInput): MeetingOutcomeMetricRecord {
    const score = scoreMeetingOutcomeFeedback(input.feedback);
    const recordedAt = input.recordedAt ?? new Date();
    const record: MeetingOutcomeMetricRecord = {
      id: input.metricId ?? crypto.randomUUID(),
      roomId: input.roomId,
      cohortId: input.cohortId,
      recordedAt: recordedAt.toISOString(),
      participantCount: input.participantIds.length,
      reward: score.reward,
      meaningfulSecondInteractionSignal: score.meaningfulSecondInteractionSignal,
      signalVersion: "demo_v1",
      rawFeedbackStored: false,
    };

    this.store.save(record);
    this.analytics.track({
      name: "meeting_outcome_scored",
      metricId: record.id,
      roomId: record.roomId,
      cohortId: record.cohortId,
      reward: record.reward,
      meaningfulSecondInteractionSignal: record.meaningfulSecondInteractionSignal,
      recordedAt: record.recordedAt,
    });

    return record;
  }

  summary(): MeetingOutcomeMetricsSummary {
    return summarizeMeetingOutcomeMetrics(this.store.list());
  }
}

export function createDemoMeetingOutcomeMetricsPipeline(): {
  store: DemoMeetingOutcomeMetricStore;
  analytics: DemoMeetingOutcomeAnalyticsSink;
  pipeline: MeetingOutcomeMetricsPipeline;
} {
  const store = new DemoMeetingOutcomeMetricStore();
  const analytics = new DemoMeetingOutcomeAnalyticsSink();
  return {
    store,
    analytics,
    pipeline: new MeetingOutcomeMetricsPipeline(store, analytics),
  };
}

export function summarizeMeetingOutcomeMetrics(
  records: readonly MeetingOutcomeMetricRecord[],
): MeetingOutcomeMetricsSummary {
  if (records.length === 0) {
    return {
      recordedRooms: 0,
      meaningfulSecondInteractionRate: 0,
      averageReward: 0,
    };
  }

  const signalCount = records.filter((record) => record.meaningfulSecondInteractionSignal).length;
  const rewardTotal = records.reduce((total, record) => total + record.reward, 0);

  return {
    recordedRooms: records.length,
    meaningfulSecondInteractionRate: roundMetric(signalCount / records.length),
    averageReward: roundMetric(rewardTotal / records.length),
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
      evidence: [
        "scoreMeetingOutcomeFeedback",
        "MeetingOutcomeMetricsPipeline",
        "DemoMeetingOutcomeMetricStore",
        "DemoMeetingOutcomeAnalyticsSink",
      ],
      gap: "Demo-only in-memory metric store; production analytics warehouse and retention policy are still planned.",
    },
  ];
}

function roundMetric(value: number): number {
  return Math.round(value * 100) / 100;
}
