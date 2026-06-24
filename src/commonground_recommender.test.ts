import { describe, expect, test } from "bun:test";
import {
  findMutualSlots,
  parseAvailabilityWindows,
  parseResearchProfile,
  recommendRoom,
} from "./commonground_recommender";

describe("CommonGround research recommender", () => {
  test("extracts interpretable profile signals from AI Passport and preferences", () => {
    const profile = parseResearchProfile(
      "I enjoy AI tools, startups, finance, psychology, books, city walks, quiet cafes, thoughtful low-pressure conversation.",
      "open to dating/social, no alcohol-heavy first meet, public venue, group of 4",
    );

    expect(profile.interests).toContain("ai");
    expect(profile.interests).toContain("finance");
    expect(profile.values).toContain("low-pressure");
    expect(profile.boundaries).toContain("public");
  });

  test("recommends a room with dyadic, group, and experience scores", () => {
    const room = recommendRoom(
      "I enjoy AI tools, startups, finance, psychology, books, city walks, quiet cafes, thoughtful low-pressure conversation.",
      "open to dating/social, Thu evening, no alcohol-heavy first meet, group of 4",
    );

    expect(room.people).toHaveLength(3);
    expect(room.scores.dyadicChemistry).toBeGreaterThan(0);
    expect(room.scores.groupDynamics).toBeGreaterThan(0);
    expect(room.scores.experienceFit).toBeGreaterThan(0);
    expect(room.methodologyNotes.join(" ")).toContain("Dyadic chemistry");
  });

  test("finds mutual slots from user and friend shared calendar windows", () => {
    const now = new Date("2026-06-06T10:00:00+08:00");
    const windows = parseAvailabilityWindows(
      [
        "you: Thu 7:30 PM, Sat 3 PM",
        "Mina: Thu 7:30 PM",
        "Ethan: Thu 7:30 PM",
      ].join("\n"),
      { now },
    );

    const slots = findMutualSlots(windows);

    expect(slots).toHaveLength(1);
    expect(slots[0]!.confidence).toBe("mutual");
    expect(slots[0]!.participants).toEqual(["you", "Mina", "Ethan"]);
  });
});
