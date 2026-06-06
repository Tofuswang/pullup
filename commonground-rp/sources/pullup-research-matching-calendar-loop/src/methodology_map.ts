export type MethodologyStatus = "implemented" | "simulated" | "future";

export type MethodologyMvpMapEntry = {
  claim: string;
  status: MethodologyStatus;
  mvpImplementation: string;
  files: string[];
  notYetReal: string[];
};

export function getMethodologyMvpMap(): MethodologyMvpMapEntry[] {
  return [
    {
      claim: "Invite-only prestige funnel",
      status: "implemented",
      mvpImplementation: "`START` opens the CommonGround first-circle invite flow.",
      files: ["src/commonground.ts"],
      notYetReal: ["NTU invite-code validation", "referral accountability"],
    },
    {
      claim: "Consent before data collection",
      status: "implemented",
      mvpImplementation: "`CONSENT` explains LinkedIn, AI Passport, and explicit preferences before intake.",
      files: ["src/commonground.ts"],
      notYetReal: ["persistent consent records", "revocation UI"],
    },
    {
      claim: "LinkedIn as true-person verification only",
      status: "simulated",
      mvpImplementation: "The app accepts and validates a LinkedIn profile URL as a consented identity handle.",
      files: ["src/commonground.ts"],
      notYetReal: ["LinkedIn API verification", "NTU/alumni email verification", "identity review queue"],
    },
    {
      claim: "AI Passport as user-approved matching input",
      status: "implemented",
      mvpImplementation: "The user pastes an app-safe Passport summary, reviews a redaction preview, and approves it.",
      files: ["src/commonground.ts"],
      notYetReal: ["Passport editor UI", "persistent CommonGround member profile table"],
    },
    {
      claim: "Convert Passport into social taste signals",
      status: "simulated",
      mvpImplementation: "A first-pass parser extracts interests, values, social modes, boundaries, energy, and intent.",
      files: ["src/commonground_recommender.ts"],
      notYetReal: ["embeddings", "vector database retrieval", "trained representation learning"],
    },
    {
      claim: "Recommend a room, not a person",
      status: "implemented",
      mvpImplementation: "The Context Card returns people, activity, venue, shared context, prompts, and boundaries.",
      files: ["src/commonground.ts", "src/commonground_recommender.ts"],
      notYetReal: ["weekly room batch generation", "human review dashboard", "multiple candidate rooms"],
    },
    {
      claim: "Reciprocal and group-native recommendation",
      status: "simulated",
      mvpImplementation: "The recommender scores dyadic chemistry, group dynamics, experience fit, and first-meeting quality.",
      files: ["src/commonground_recommender.ts"],
      notYetReal: ["learned reciprocal accept-probability model", "fairness constraints", "contextual bandit learning"],
    },
    {
      claim: "Local iOS scheduling handoff",
      status: "implemented",
      mvpImplementation: "Users send free windows from iPhone Calendar; the app prepares an iPhone Calendar-ready card, and the native iOS package can request EventKit write-only access to create confirmed events.",
      files: [
        "src/commonground.ts",
        "src/ios.ts",
        "src/calendar.ts",
        "ios/PullupCalendar/Sources/PullupCalendar/EventKitCalendarWriter.swift",
      ],
      notYetReal: ["full-access conflict detection", "Calendar picker UI inside a complete iOS app target"],
    },
    {
      claim: "Apple Maps, location, and Contacts handoff",
      status: "simulated",
      mvpImplementation: "The app generates Apple Maps links and asks users to voluntarily share location/contact details.",
      files: ["src/ios.ts", "docs/ios-local-integrations.md"],
      notYetReal: ["MapKit venue picker", "CoreLocation permission", "Contacts picker"],
    },
    {
      claim: "Vibe feedback, not person rating",
      status: "implemented",
      mvpImplementation: "Post-room feedback asks what to tune next time instead of asking users to rate people.",
      files: ["src/commonground.ts"],
      notYetReal: ["feedback persistence", "member trust updates", "bandit-based learning loop"],
    },
  ];
}

export function formatMethodologyMvpMap(
  entries: MethodologyMvpMapEntry[] = getMethodologyMvpMap(),
): string {
  return [
    "CommonGround methodology → MVP code map",
    "",
    ...entries.flatMap((entry, index) => [
      `${index + 1}. ${entry.claim}`,
      `Status: ${entry.status}`,
      `MVP: ${entry.mvpImplementation}`,
      `Code: ${entry.files.join(", ")}`,
      `Not yet real: ${entry.notYetReal.join("; ")}`,
      "",
    ]),
    "Pitch-safe line:",
    "The MVP uses honest first-pass product heuristics. It does not scrape LinkedIn, silently read iPhone data, or claim a trained compatibility model.",
  ].join("\n");
}
