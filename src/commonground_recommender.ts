export type ResearchProfile = {
  interests: string[];
  values: string[];
  socialModes: string[];
  energy: "low" | "medium" | "high";
  intents: string[];
  boundaries: string[];
  embeddingText: string;
};

export type CandidatePerson = {
  id: string;
  name: string;
  role: string;
  profile: ResearchProfile;
};

export type RoomRecommendation = {
  title: string;
  activity: string;
  venue: string;
  people: CandidatePerson[];
  sharedContext: string[];
  prompts: string[];
  reason: string;
  scores: {
    dyadicChemistry: number;
    groupDynamics: number;
    experienceFit: number;
    firstMeetingQuality: number;
  };
  methodologyNotes: string[];
};

export type AvailabilityWindow = {
  person: string;
  start: Date;
  end: Date;
  label: string;
};

export type MutualSlot = {
  id: string;
  label: string;
  start: Date;
  end: Date;
  participants: string[];
  confidence: "mutual" | "user_only";
};

const interestTerms = [
  "ai",
  "technology",
  "startup",
  "product",
  "finance",
  "markets",
  "psychology",
  "books",
  "travel",
  "city walks",
  "cafes",
  "matcha",
  "gallery",
  "art",
  "career",
  "mba",
  "design",
];

const valueTerms = [
  "curiosity",
  "thoughtful",
  "ambition",
  "creativity",
  "stability",
  "emotional maturity",
  "low-pressure",
  "respect",
  "safety",
];

const socialModeTerms = [
  "deep talk",
  "playful",
  "banter",
  "intellectual",
  "structured",
  "small group",
  "walk",
  "workshop",
  "dinner",
  "coffee",
];

export function parseResearchProfile(passport: string, preferences = ""): ResearchProfile {
  const text = `${passport} ${preferences}`.toLowerCase();
  const interests = pickTerms(text, interestTerms);
  const values = pickTerms(text, valueTerms);
  const socialModes = pickTerms(text, socialModeTerms);
  const boundaries = pickTerms(text, [
    "no alcohol",
    "not alcohol",
    "public",
    "no forced contact",
    "contact exchange",
    "quiet",
    "not loud",
    "avoid loud",
    "safe",
  ]);
  const intents = pickTerms(text, ["dating", "friendship", "social", "networking", "career"]);

  return {
    interests,
    values,
    socialModes,
    boundaries,
    intents,
    energy: inferEnergy(text),
    embeddingText: `${passport} ${preferences}`.replace(/\s+/g, " ").trim(),
  };
}

export function recommendRoom(passport: string, preferences: string): RoomRecommendation {
  const user = parseResearchProfile(passport, preferences);
  const people = candidatePeople
    .map((person) => ({ person, score: dyadicScore(user, person.profile) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.person);

  const sharedContext = sharedTerms(user, people);
  const dyadicChemistry = average(people.map((person) => dyadicScore(user, person.profile)));
  const groupDynamics = groupScore(user, people);
  const experienceFit = activityScore(user, "coffee / matcha with structured conversation cards");
  const firstMeetingQuality = roundScore(
    dyadicChemistry * 0.4 + groupDynamics * 0.35 + experienceFit * 0.25,
  );

  return {
    title: "AI x Career Transition Coffee Room",
    activity: "coffee / matcha with structured conversation cards",
    venue: "quiet cafe near Da'an Taipei",
    people,
    sharedContext,
    prompts: [
      "What is one workflow you wish AI could automate?",
      "What kind of city place makes you feel most like yourself?",
      "What is a career topic you enjoy discussing but rarely get to talk about?",
    ],
    reason:
      "High conversation density, compatible low-medium social energy, public-first venue, and no forced contact exchange.",
    scores: {
      dyadicChemistry,
      groupDynamics,
      experienceFit,
      firstMeetingQuality,
    },
    methodologyNotes: [
      "Dyadic chemistry: shared interests, values, and reciprocal conversation anchors.",
      "Group dynamics: small-group energy balance, conversational anchors, and minimum comfort.",
      "Experience fit: activity reduces awkwardness and supports structured self-disclosure.",
    ],
  };
}

export function parseAvailabilityWindows(
  text: string,
  options: { now?: Date; defaultPerson?: string } = {},
): AvailabilityWindow[] {
  const now = options.now ?? new Date();
  const defaultPerson = options.defaultPerson ?? "you";
  const chunks = text
    .replace(/[；;]/g, "\n")
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const windows: AvailabilityWindow[] = [];
  for (const chunk of chunks.length ? chunks : [text]) {
    const labeled = chunk.match(/^([^:：]+)[:：]\s*(.+)$/);
    const person = labeled ? normalizePerson(labeled[1]!) : defaultPerson;
    const availabilityText = labeled ? labeled[2]! : chunk;
    for (const part of availabilityText.split(/[，,]/).map((item) => item.trim()).filter(Boolean)) {
      const slot = parseWindow(part, person, now);
      if (slot) windows.push(slot);
    }
  }

  return windows;
}

export function findMutualSlots(windows: AvailabilityWindow[]): MutualSlot[] {
  if (windows.length === 0) return [];

  const people = [...new Set(windows.map((window) => window.person))];
  const anchor = people.includes("you") ? "you" : people[0]!;
  const anchorWindows = windows.filter((window) => window.person === anchor);

  if (people.length === 1) {
    return anchorWindows.slice(0, 3).map((window, index) => ({
      id: String(index + 1),
      label: window.label,
      start: window.start,
      end: window.end,
      participants: [anchor],
      confidence: "user_only",
    }));
  }

  return anchorWindows
    .flatMap((anchorWindow) => {
      const matches = people
        .filter((person) => person !== anchor)
        .map((person) => windows.find((window) => window.person === person && overlaps(anchorWindow, window)));
      if (matches.some((match) => !match)) return [];
      const allWindows = [anchorWindow, ...(matches as AvailabilityWindow[])];
      const start = new Date(Math.max(...allWindows.map((window) => window.start.getTime())));
      const end = new Date(Math.min(...allWindows.map((window) => window.end.getTime())));
      if (end.getTime() - start.getTime() < 60 * 60_000) return [];
      return [{ start, end, people }];
    })
    .slice(0, 3)
    .map((slot, index) => ({
      id: String(index + 1),
      label: formatSlot(slot.start),
      start: slot.start,
      end: slot.end,
      participants: slot.people,
      confidence: "mutual" as const,
    }));
}

export function formatSlotPrompt(people: string[]): string {
  const participantHint = people.length
    ? ` If you already have friends' availability, label it like: you: Thu 7:30 PM; ${people[0]}: Thu 7:30 PM.`
    : "";
  return [
    "Great. Check your iPhone Calendar and send 2-4 free windows.",
    "",
    "Example: you: Thu 7:30 PM, Sat 3 PM",
    participantHint,
    "",
    "I only need free windows, not event names or private details.",
  ].join("\n");
}

function pickTerms(text: string, terms: string[]): string[] {
  return terms.filter((term) => text.includes(term));
}

function inferEnergy(text: string): ResearchProfile["energy"] {
  if (text.includes("high energy") || text.includes("extrovert")) return "high";
  if (text.includes("low energy") || text.includes("introvert") || text.includes("quiet")) return "low";
  return "medium";
}

function dyadicScore(user: ResearchProfile, candidate: ResearchProfile): number {
  const interestOverlap = overlapRatio(user.interests, candidate.interests);
  const valueOverlap = overlapRatio(user.values, candidate.values);
  const modeOverlap = overlapRatio(user.socialModes, candidate.socialModes);
  const energyFit = user.energy === candidate.energy ? 1 : 0.7;
  return roundScore(0.35 * interestOverlap + 0.3 * valueOverlap + 0.2 * modeOverlap + 0.15 * energyFit);
}

function groupScore(user: ResearchProfile, people: CandidatePerson[]): number {
  const allModes = new Set([...user.socialModes, ...people.flatMap((person) => person.profile.socialModes)]);
  const allInterests = new Set([...user.interests, ...people.flatMap((person) => person.profile.interests)]);
  const energySpread = new Set([user.energy, ...people.map((person) => person.profile.energy)]).size;
  return roundScore(Math.min(1, allModes.size / 5) * 0.35 + Math.min(1, allInterests.size / 8) * 0.4 + (energySpread >= 2 ? 0.25 : 0.15));
}

function activityScore(user: ResearchProfile, activity: string): number {
  const text = `${user.embeddingText} ${activity}`.toLowerCase();
  let score = 0.6;
  if (text.includes("coffee") || text.includes("matcha") || text.includes("cafe")) score += 0.18;
  if (text.includes("structured") || text.includes("low-pressure")) score += 0.12;
  if (text.includes("not loud") || text.includes("avoid loud") || text.includes("quiet")) score += 0.1;
  return roundScore(Math.min(1, score));
}

function sharedTerms(user: ResearchProfile, people: CandidatePerson[]): string[] {
  const terms = new Set<string>();
  for (const person of people) {
    for (const interest of user.interests) {
      if (person.profile.interests.includes(interest)) terms.add(interest);
    }
    for (const value of user.values) {
      if (person.profile.values.includes(value)) terms.add(value);
    }
  }
  const selected = [...terms].slice(0, 4);
  return selected.length
    ? selected
    : ["AI changing work", "low-pressure conversation", "city cafe culture"];
}

function overlapRatio(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0.4;
  const bSet = new Set(b);
  const overlap = a.filter((item) => bSet.has(item)).length;
  return overlap / Math.max(a.length, b.length);
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return roundScore(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}

function parseWindow(text: string, person: string, now: Date): AvailabilityWindow | undefined {
  const dayOffset = dayOffsetFrom(text.toLowerCase(), now);
  const time = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (dayOffset === undefined || !time) return undefined;
  let hour = Number(time[1]);
  const minute = time[2] ? Number(time[2]) : 0;
  const meridiem = time[3]?.toLowerCase();
  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  if (!meridiem && hour < 9) hour += 12;
  const start = new Date(now);
  start.setDate(now.getDate() + dayOffset);
  start.setHours(hour, minute, 0, 0);
  const end = new Date(start.getTime() + 90 * 60_000);
  return { person, start, end, label: formatSlot(start) };
}

function dayOffsetFrom(text: string, now: Date): number | undefined {
  if (text.includes("tomorrow")) return 1;
  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const targetDay = days.findIndex((day) => text.includes(day));
  if (targetDay === -1) return undefined;
  const offset = (targetDay - now.getDay() + 7) % 7;
  return offset === 0 ? 7 : offset;
}

function overlaps(a: AvailabilityWindow, b: AvailabilityWindow): boolean {
  return a.start < b.end && a.end > b.start;
}

function normalizePerson(person: string): string {
  const value = person.trim().toLowerCase();
  if (["me", "my", "i", "user", "vivian"].includes(value)) return "you";
  return person.trim();
}

function formatSlot(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

const candidatePeople: CandidatePerson[] = [
  {
    id: "u_004",
    name: "Mina",
    role: "AI product manager",
    profile: parseResearchProfile(
      "AI product manager who likes AI tools, startups, career transitions, quiet cafes, structured low-pressure conversation, city walks, and product strategy.",
    ),
  },
  {
    id: "u_007",
    name: "Ethan",
    role: "NTU alum, fintech builder",
    profile: parseResearchProfile(
      "NTU alum and fintech builder interested in finance, markets, startups, matcha, thoughtful conversation, career growth, and small group coffee.",
    ),
  },
  {
    id: "u_009",
    name: "Claire",
    role: "UX researcher",
    profile: parseResearchProfile(
      "UX researcher who enjoys psychology, books, art, gallery walks, emotional maturity, public safe settings, and structured self-disclosure.",
    ),
  },
  {
    id: "u_011",
    name: "Jason",
    role: "MBA candidate",
    profile: parseResearchProfile(
      "MBA candidate interested in travel, career, networking, playful banter, dinner, and high energy group experiences.",
    ),
  },
];
