import "dotenv/config";

import OpenAI from "openai";
import { Spectrum, poll } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";
import { terminal } from "spectrum-ts/providers/terminal";

type OnboardingState =
  | "invited"
  | "consented"
  | "linkedin_received"
  | "passport_received"
  | "passport_approved"
  | "preferences_received"
  | "profile_approved"
  | "mutual_confirm_pending"
  | "event_confirmed"
  | "feedback_collected";

type Session = {
  state: OnboardingState;
  linkedinUrl?: string;
  aiPassportDraft?: string;
  preferencesDraft?: string;
};

const sessions = new Map<string, Session>();

const llm = process.env.LLM_KEY
  ? new OpenAI({
      baseURL: process.env.LLM_BASE_URL,
      apiKey: process.env.LLM_KEY,
    })
  : null;

function sessionKey(message: any) {
  return `${message.platform}:${message.sender.id}`;
}

function textOf(message: any) {
  return message.content.type === "text" ? message.content.text.trim() : "";
}

async function summarizePassportForUser(passportText: string) {
  if (!llm) {
    return [
      "Here is how CommonGround understands your first-meet style:",
      "",
      "You enjoy thoughtful, curious conversation in small, low-pressure groups. You like ideas, city life, cafes, books, AI/product conversations, and activities that give people something natural to talk about.",
      "",
      "Best first-meet settings for you:",
      "- Coffee, tea, or dessert in a calm place",
      "- Bookstore plus cafe",
      "- Gallery or neighborhood walk",
      "- Small AI/product mini-salon",
      "- Structured small-group activity",
      "",
      "We should avoid loud bars, alcohol-centered first meetings, high-pressure networking, and overly intense one-on-one setups.",
      "",
      "Reply APPROVE if this feels right, or EDIT followed by what you want changed.",
    ].join("\n");
  }

  const response = await llm.chat.completions.create({
    model: process.env.LLM_MODEL ?? "deepseek/deepseek-v3",
    messages: [
      {
        role: "system",
        content:
          "You are CommonGround's onboarding concierge. Convert the user's AI Passport into a warm plain-language profile preview. Do not output JSON. Do not mention internal scores. Keep it concise and privacy-safe.",
      },
      {
        role: "user",
        content: passportText,
      },
    ],
  });

  return response.choices[0]?.message?.content?.trim() || "I could not summarize that cleanly. Please paste a shorter AI Passport.";
}

async function main() {
  const providers: any[] = [terminal.config()];

  if (process.env.PROJECT_ID && process.env.PROJECT_SECRET) {
    providers.push(imessage.config());
  }

  const app = await Spectrum({
    projectId: process.env.PROJECT_ID,
    projectSecret: process.env.PROJECT_SECRET,
    providers,
    telemetry: true,
  });

  console.log("CommonGround Spectrum agent is running.");
  console.log("Local demo: use the terminal provider. iMessage activates when PROJECT_ID and PROJECT_SECRET are set.");

  for await (const [space, message] of app.messages) {
    const text = textOf(message);
    if (!text) {
      await space.send("I can read text for this demo. Please send a short message.");
      continue;
    }

    const key = sessionKey(message);
    const session = sessions.get(key) ?? { state: "invited" };

    await space.responding(async () => {
      const next = await handleTurn(session, text, space);
      sessions.set(key, next);
    });
  }
}

async function handleTurn(session: Session, text: string, space: any): Promise<Session> {
  const normalized = text.toUpperCase();

  if (session.state === "invited") {
    if (normalized !== "START") {
      await space.send(
        "You are one of a small first circle invited to CommonGround: a private NTU-origin room network for meeting thoughtful people offline.\n\nWe do not do swiping. We design a room worth showing up for.\n\nReply START to claim your invite.",
      );
      return session;
    }

    await space.send(
      "To keep the room trusted, reply CONSENT if we may verify you are a real person and help you build a private matching profile from only what you approve.",
    );
    return { ...session, state: "consented" };
  }

  if (session.state === "consented") {
    if (normalized !== "CONSENT") {
      await space.send("Please reply CONSENT when you are ready. You can stop at any time.");
      return session;
    }

    await space.send("Step 1: paste your LinkedIn URL. We use it only for true-person verification, not for matching facts.");
    return { ...session, state: "linkedin_received" };
  }

  if (session.state === "linkedin_received") {
    if (!text.includes("linkedin.com/in/")) {
      await space.send("Please paste a LinkedIn profile URL, like https://www.linkedin.com/in/your-handle/");
      return session;
    }

    await space.send(
      "Verified as a consented identity handle. Now create your AI Passport: ask your everyday AI to summarize your social energy, conversation style, interests, first-meet settings, awkwardness triggers, and boundaries. Paste the result here.",
    );
    return { ...session, state: "passport_received", linkedinUrl: text };
  }

  if (session.state === "passport_received") {
    await space.send(
      "Got it. Review what you pasted. Reply APPROVE PASSPORT if it is safe to use, or EDIT followed by what you want changed/removed.",
    );
    return { ...session, state: "passport_approved", aiPassportDraft: text };
  }

  if (session.state === "passport_approved") {
    if (!normalized.startsWith("APPROVE")) {
      await space.send("No problem. Tell me what to remove or change, then reply APPROVE PASSPORT when it feels right.");
      return session;
    }

    await space.send(
      "Last details we should never infer: intent, available times, budget range, neighborhood radius, alcohol comfort, preferred group size, and contact-exchange boundary.",
    );
    return { ...session, state: "preferences_received" };
  }

  if (session.state === "preferences_received") {
    const preview = await summarizePassportForUser(session.aiPassportDraft ?? "");
    await space.send(preview);
    return { ...session, state: "profile_approved", preferencesDraft: text };
  }

  if (session.state === "profile_approved") {
    if (normalized !== "APPROVE") {
      await space.send("Send EDIT plus what you want changed, or APPROVE when ready.");
      return session;
    }

    await space.send(
      "RoomTAIRA found a first room: Gallery walk + tea, 4 people, Sunday afternoon.\n\nWhy it works: shared AI/product curiosity, low-pressure setting, public venue, and strong conversation density.",
    );
    await space.send(poll("Are you in for this CommonGround room?", "YES", "MAYBE", "SKIP"));
    return { ...session, state: "mutual_confirm_pending" };
  }

  if (session.state === "mutual_confirm_pending") {
    await space.send("Saved. If enough people opt in, I will create the iMessage group and send the short Context Card.");
    return { ...session, state: "event_confirmed" };
  }

  await space.send("You're all set. After the event, I will ask a few vibe-tuning questions.");
  return session;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
