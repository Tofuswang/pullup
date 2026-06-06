import { describe, expect, test } from "bun:test";
import { formatMethodologyMvpMap, getMethodologyMvpMap } from "./methodology_map";

describe("methodology MVP map", () => {
  test("returns structured implementation status entries", () => {
    const entries = getMethodologyMvpMap();

    expect(entries.length).toBeGreaterThan(5);
    expect(entries.some((entry) => entry.claim.includes("LinkedIn"))).toBe(true);
    expect(entries.some((entry) => entry.files.includes("src/commonground_recommender.ts"))).toBe(true);
    expect(entries.some((entry) => entry.files.includes("ios/PullupCalendar/Sources/PullupCalendar/EventKitCalendarWriter.swift"))).toBe(true);
    expect(entries.some((entry) => entry.notYetReal.includes("full-access conflict detection"))).toBe(true);
  });

  test("formats a pitch-safe methodology summary", () => {
    const text = formatMethodologyMvpMap();

    expect(text).toContain("CommonGround methodology");
    expect(text).toContain("Status:");
    expect(text).toContain("does not scrape LinkedIn");
    expect(text).toContain("trained compatibility model");
  });
});
