import dotenv from "dotenv";
import OpenAI from "openai";
import { Spectrum } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";

dotenv.config({ override: true });

type Step =
  | "choose_plan"
  | "ask_linkedin"
  | "ask_passport"
  | "ask_passport_approval"
  | "ask_preferences"
  | "ask_profile_approval"
  | "recommend_room"
  | "done";

type Session = {
  step: Step;
  plan?: string;
  linkedin?: string;
  passport?: string;
  preferences?: string;
  lastIncoming?: string;
  lastIncomingAt?: number;
  lastReply?: string;
};

const sessions = new Map<string, Session>();
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const projectId = process.env.PROJECT_ID;
const projectSecret = process.env.PROJECT_SECRET;

if (!projectId || !projectSecret) {
  throw new Error("Missing PROJECT_ID or PROJECT_SECRET in .env");
}

console.log({
  projectId,
  secretLoaded: !!projectSecret,
  secretStartsWrong: projectSecret.startsWith("read"),
  secretPrefix: projectSecret.slice(0, 4),
  secretSuffix: projectSecret.slice(-4),
});

const app = await Spectrum({
  projectId,
  projectSecret,
  providers: [imessage.config()],
});

console.log("CommonGround iMessage agent is running.");

for await (const [space, message] of app.messages) {
  if (message.content.type !== "text") {
    console.log(`[${message.platform}] ignored non-text message of type ${message.content.type}`);
    continue;
  }

  const incoming = cleanIncoming(message.content.text);
  const senderId = message.sender?.id ?? space.id ?? `${message.platform}:unknown-sender`;
  const session = sessions.get(senderId) ?? { step: "choose_plan" };

  console.log(`[${message.platform}] ${senderId} (${session.step}): ${incoming}`);

  await space.responding(async () => {
    if (isDuplicateInbound(incoming, session)) {
      console.log(`[${message.platform}] ${senderId}: duplicate ignored`);
      return;
    }

    const { reply, next } = await handleIncoming(incoming, session);
    sessions.set(senderId, {
      ...next,
      lastIncoming: incoming,
      lastIncomingAt: Date.now(),
      lastReply: reply,
    });
    await space.send(cleanOutgoing(reply));
  });
}

async function handleIncoming(incoming: string, session: Session): Promise<{ reply: string; next: Session }> {
  const normalized = cleanIncoming(incoming).toLowerCase();

  if (["restart", "reset", "start"].includes(normalized)) {
    return {
      reply: openingMessage(),
      next: { step: "choose_plan" },
    };
  }

  if (isLinkedInUrl(normalized) && ["choose_plan", "ask_linkedin"].includes(session.step)) {
    return {
      reply:
        "Verified as a consented identity handle.\n\n" +
        "Now create your AI Passport: ask your everyday AI to summarize your social energy, conversation style, interests, good first-meet settings, awkwardness triggers, and boundaries. Paste the result here.",
      next: { ...session, step: "ask_passport", linkedin: incoming },
    };
  }

  if (session.step === "choose_plan") {
    const plan = parsePlan(normalized);
    if (!plan) {
      return {
        reply: openingMessage(),
        next: session,
      };
    }

    return {
      reply:
        `Love it. I’ll tune your first room toward ${plan}.\n\n` +
        "To keep CommonGround trusted, paste your LinkedIn URL next. We use it only for true-person verification, not for matching facts.",
      next: { ...session, step: "ask_linkedin", plan },
    };
  }

  if (session.step === "ask_linkedin") {
    if (!isLinkedInUrl(normalized)) {
      return {
        reply: "Please paste your LinkedIn profile URL. We use it only to verify you are a real person.",
        next: session,
      };
    }

    return {
      reply:
        "Verified as a consented identity handle.\n\n" +
        "Now create your AI Passport: ask your everyday AI to summarize your social energy, conversation style, interests, good first-meet settings, awkwardness triggers, and boundaries. Paste the result here.",
      next: { ...session, step: "ask_passport", linkedin: incoming },
    };
  }

  if (session.step === "ask_passport") {
    return {
      reply:
        "Got it. I’ll use this only after you approve it.\n\n" +
        "Reply APPROVE PASSPORT if it is safe to convert into matching signals, or EDIT followed by what you want removed.",
      next: { ...session, step: "ask_passport_approval", passport: incoming },
    };
  }

  if (session.step === "ask_passport_approval") {
    if (!normalized.startsWith("approve")) {
      return {
        reply: "No problem. Send EDIT plus what you want changed, then reply APPROVE PASSPORT when it feels right.",
        next: session,
      };
    }

    return {
      reply:
        "Last details we should never infer: intent, available times, budget range, neighborhood radius, alcohol comfort, preferred group size, and contact-exchange boundary.",
      next: { ...session, step: "ask_preferences" },
    };
  }

  if (session.step === "ask_preferences") {
    const preview = await buildProfilePreview({
      plan: session.plan,
      passport: session.passport,
      preferences: incoming,
    });

    return {
      reply: preview,
      next: { ...session, step: "ask_profile_approval", preferences: incoming },
    };
  }

  if (session.step === "ask_profile_approval") {
    if (normalized !== "approve") {
      return {
        reply: "Send EDIT plus what you want changed, or APPROVE when ready.",
        next: session,
      };
    }

    return {
      reply:
        "Your first room is ready:\n\n" +
        `${roomTitle(session.plan)}\n` +
        "4 people\n" +
        "Sunday afternoon\n" +
        "Public venue near Da’an / Zhongshan\n\n" +
        "Why this room works:\n" +
        "- shared curiosity around AI/product ideas and city life\n" +
        "- low-pressure setting with a clear activity\n" +
        "- no forced contact exchange\n\n" +
        "Reply YES, MAYBE, or SKIP.",
      next: { ...session, step: "recommend_room" },
    };
  }

  if (session.step === "recommend_room") {
    if (["yes", "maybe", "skip"].includes(normalized)) {
      return {
        reply:
          normalized === "yes"
            ? "You’re in. If enough people opt in, I’ll create the iMessage room and send the short Context Card."
            : "Saved. I’ll use that signal to tune your next room.",
        next: { ...session, step: "done" },
      };
    }

    return {
      reply: "Reply YES, MAYBE, or SKIP.",
      next: session,
    };
  }

  return {
    reply: "You’re all set. After the event, I’ll ask a few vibe-tuning questions.",
    next: session,
  };
}

function openingMessage() {
  return `You’re in.

CommonGround is opening its first circle quietly — for people who want to meet offline without swiping, forced networking, or awkward first-date pressure.

I’ll help design a small room worth showing up for.

First: what kind of plan would you actually say yes to?

1. Coffee / matcha
2. Gallery walk
3. Dinner
4. City walk
5. Mini workshop`;
}

function parsePlan(input: string) {
  if (input.includes("1") || input.includes("coffee") || input.includes("matcha")) return "coffee / matcha";
  if (input.includes("2") || input.includes("gallery") || input.includes("art")) return "gallery walk";
  if (input.includes("3") || input.includes("dinner")) return "dinner";
  if (input.includes("4") || input.includes("city") || input.includes("walk")) return "city walk";
  if (input.includes("5") || input.includes("workshop")) return "mini workshop";
  return null;
}

function isLinkedInUrl(input: string) {
  return input.includes("linkedin.com/in/") || input.includes("linkedin.cn/in/");
}

function cleanIncoming(input: string) {
  return input
    .trim()
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/^["']+|["']+$/g, "")
    .trim();
}

function isDuplicateInbound(incoming: string, session: Session) {
  if (!session.lastIncoming || !session.lastIncomingAt) return false;
  return session.lastIncoming === incoming && Date.now() - session.lastIncomingAt < 15_000;
}

async function buildProfilePreview(input: { plan?: string; passport?: string; preferences?: string }) {
  const fallback =
    "Here is your plain-language preview:\n\n" +
    `You prefer a ${input.plan ?? "low-pressure"} first room with thoughtful people, public settings, clear plans, and no forced contact exchange.\n\n` +
    "Other members will not see your raw AI Passport, LinkedIn URL, dating intent, contact info, or internal scores.\n\n" +
    "Reply APPROVE if this feels right, or EDIT followed by changes.";

  if (!openai) return fallback;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are CommonGround's iMessage onboarding concierge. Write only the final user-facing message. Convert the user's AI Passport and explicit preferences into a warm, concise, plain-language matching profile preview. Do not output JSON. Do not mention internal scores, embeddings, scraping, algorithms, agent traces, roles, hidden plans, chain-of-thought, or draft notes. Never include bracketed labels like [agent trace]. End with: Reply APPROVE if this feels right, or EDIT followed by changes.",
        },
        {
          role: "user",
          content: [
            `Preferred first room: ${input.plan ?? "low-pressure"}`,
            `AI Passport: ${input.passport ?? ""}`,
            `Explicit preferences: ${input.preferences ?? ""}`,
          ].join("\n\n"),
        },
      ],
    });

    return response.choices[0]?.message?.content?.trim() || fallback;
  } catch (error) {
    console.error("OpenAI preview failed; using fallback.", error);
    return fallback;
  }
}

function cleanOutgoing(output: string) {
  const blocked = [
    "[agent trace]",
    "Host Concierge:",
    "Event Strategist:",
    "Invite Copy:",
    "chain-of-thought",
    "hidden plan",
  ];
  let cleaned = output;
  for (const marker of blocked) {
    if (cleaned.includes(marker)) {
      cleaned = cleaned
        .split("\n")
        .filter((line) => !blocked.some((item) => line.includes(item)))
        .join("\n")
        .trim();
    }
  }
  return cleaned || "I’m ready. Please reply with the next step.";
}

function roomTitle(plan?: string) {
  if (plan === "coffee / matcha") return "Coffee + conversation cards";
  if (plan === "gallery walk") return "Gallery walk + tea";
  if (plan === "dinner") return "Small dinner table";
  if (plan === "city walk") return "City walk + cafe stop";
  if (plan === "mini workshop") return "Mini workshop + debrief";
  return "Low-pressure room";
}
