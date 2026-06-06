import { describe, expect, test } from "bun:test";
import {
  buildConsentLedgerEntry,
  methodologyCoverage,
  permissionLadder,
  productSurfaces,
  scoreMeetingOutcomeFeedback,
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

  test("covers the attachment methodology at MVP or planned-native level", () => {
    const coverage = methodologyCoverage();

    expect(coverage).toHaveLength(6);
    expect(coverage.map((item) => item.requirement).join(" ")).toContain("Four-surface architecture");
    expect(coverage.map((item) => item.requirement).join(" ")).toContain("Deterministic scheduling truth");
    expect(coverage.map((item) => item.requirement).join(" ")).toContain("meaningful second interaction");
    expect(coverage.every((item) => item.evidence.length > 0)).toBe(true);
  });
});
