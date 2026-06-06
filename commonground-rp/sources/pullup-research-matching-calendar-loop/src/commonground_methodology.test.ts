import { describe, expect, test } from "bun:test";
import {
  buildConsentLedgerEntry,
  createDemoMeetingOutcomeMetricsPipeline,
  methodologyCoverage,
  permissionLadder,
  productSurfaces,
  scoreMeetingOutcomeFeedback,
  summarizeMeetingOutcomeMetrics,
} from "./commonground_methodology";

describe("CommonGround methodology mapping", () => {
  test("maps the four-surface product architecture", () => {
    expect(productSurfaces.map((surface) => surface.id)).toEqual([
      "ios_app_brain",
      "imessage_surface",
      "app_intents_shortcuts",
      "web_fallback",
    ]);

    expect(productSurfaces.find((surface) => surface.id === "imessage_surface")?.status)
      .toBe("implemented_mvp");
    expect(productSurfaces.find((surface) => surface.id === "ios_app_brain")?.status)
      .toBe("planned_native");
  });

  test("keeps permissions minimum viable with manual fallbacks", () => {
    const ids = permissionLadder.map((tier) => tier.id);

    expect(ids).toContain("linkedin_verification");
    expect(ids).toContain("manual_availability");
    expect(ids).toContain("apple_calendar_write_only");
    expect(permissionLadder.find((tier) => tier.id === "manual_availability")?.dataUsed)
      .toContain("no event titles");
    expect(permissionLadder.find((tier) => tier.id === "apple_calendar_write_only")?.status)
      .toBe("implemented_mvp");
    expect(permissionLadder.every((tier) => tier.fallback.length > 0)).toBe(true);
  });

  test("creates revocable consent records without raw data storage", () => {
    const entry = buildConsentLedgerEntry({
      userId: "u_001",
      source: "ai_passport",
      dataCategories: ["taste signals", "boundaries"],
      consentedAt: new Date("2026-06-06T12:00:00+08:00"),
    });

    expect(entry.revocable).toBe(true);
    expect(entry.rawDataStored).toBe(false);
    expect(entry.consentedAt).toBe("2026-06-06T04:00:00.000Z");
  });

  test("scores meaningful second interaction instead of message volume", () => {
    const score = scoreMeetingOutcomeFeedback({
      attended: true,
      conversationFeltNatural: true,
      wouldMeetSimilarPeopleAgain: true,
      activityWasGoodContainer: true,
      mutualOptInOccurred: false,
      noSafetyIssue: true,
    });

    expect(score.reward).toBe(0.9);
    expect(score.meaningfulSecondInteractionSignal).toBe(true);
  });

  test("records outcome metrics through the demo analytics and storage pipeline", () => {
    const { store, analytics, pipeline } = createDemoMeetingOutcomeMetricsPipeline();
    const recordedAt = new Date("2026-06-07T10:00:00+08:00");

    const record = pipeline.record({
      metricId: "msi_room_001_demo",
      roomId: "room_001",
      cohortId: "ntu_week_1",
      participantIds: ["u_001", "u_002"],
      recordedAt,
      feedback: {
        attended: true,
        conversationFeltNatural: true,
        wouldMeetSimilarPeopleAgain: true,
        activityWasGoodContainer: true,
        mutualOptInOccurred: false,
        noSafetyIssue: true,
      },
    });

    expect(record).toEqual({
      id: "msi_room_001_demo",
      roomId: "room_001",
      cohortId: "ntu_week_1",
      recordedAt: "2026-06-07T02:00:00.000Z",
      participantCount: 2,
      reward: 0.9,
      meaningfulSecondInteractionSignal: true,
      signalVersion: "demo_v1",
      rawFeedbackStored: false,
    });
    expect(store.list()).toEqual([record]);
    expect(analytics.list()).toEqual([
      {
        name: "meeting_outcome_scored",
        metricId: record.id,
        roomId: "room_001",
        cohortId: "ntu_week_1",
        reward: 0.9,
        meaningfulSecondInteractionSignal: true,
        recordedAt: "2026-06-07T02:00:00.000Z",
      },
    ]);
    expect(pipeline.summary()).toEqual({
      recordedRooms: 1,
      meaningfulSecondInteractionRate: 1,
      averageReward: 0.9,
    });
  });

  test("summarizes empty outcome metrics without NaN values", () => {
    expect(summarizeMeetingOutcomeMetrics([])).toEqual({
      recordedRooms: 0,
      meaningfulSecondInteractionRate: 0,
      averageReward: 0,
    });
  });

  test("covers the attachment methodology at MVP or planned-native level", () => {
    const coverage = methodologyCoverage();

    expect(coverage).toHaveLength(6);
    expect(coverage.map((item) => item.requirement).join(" ")).toContain("Four-surface architecture");
    expect(coverage.map((item) => item.requirement).join(" ")).toContain("Deterministic scheduling truth");
    expect(coverage.map((item) => item.requirement).join(" ")).toContain("meaningful second interaction");
    expect(coverage.flatMap((item) => item.evidence)).toContain("MeetingOutcomeMetricsPipeline");
    expect(coverage.every((item) => item.evidence.length > 0)).toBe(true);
  });
});
