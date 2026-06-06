import OpenAI from "openai";

export type AgentInput = {
  conversationId: string;
  text: string;
  channel: "terminal" | "imessage" | "unknown";
};

export type AgentResponse = {
  text: string;
};

type AgentName =
  | "Host Concierge"
  | "Event Strategist"
  | "Invite Copy"
  | "Safety & Trust"
  | "RSVP Coordinator";

type EventDraft = {
  purpose?: string;
  guests?: string;
  vibe?: string;
};

type ConversationState = {
  step: "idle" | "collecting_guests" | "collecting_vibe" | "draft_ready";
  draft: EventDraft;
  history: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
};

type ReplyContext = {
  state: ConversationState;
  userText: string;
  fallback: string;
  intent:
    | "empty"
    | "reset"
    | "clarify_event"
    | "ask_guests"
    | "ask_vibe"
    | "show_draft"
    | "tighten_draft";
  trace: AgentTraceStep[];
};

export type PullupLlm = {
  generateReply: (context: ReplyContext) => Promise<string>;
};

type AgentTraceStep = {
  agent: AgentName;
  action: string;
};

let llmOverride: PullupLlm | undefined;
let openaiClient: OpenAI | undefined;

const conversations = new Map<string, ConversationState>();

function getState(conversationId: string): ConversationState {
  const existing = conversations.get(conversationId);
  if (existing) return existing;

  const fresh: ConversationState = {
    step: "idle",
    draft: {},
    history: [],
  };
  conversations.set(conversationId, fresh);
  return fresh;
}

function looksLikeEventStart(text: string): boolean {
  const normalized = text.toLowerCase();
  return [
    "host",
    "plan",
    "event",
    "dinner",
    "party",
    "meetup",
    "pull up",
    "pullup",
    "invite",
    "揪",
    "活動",
    "約",
    "局",
    "飯局",
  ].some((keyword) => normalized.includes(keyword));
}

function systemPromptFor(context: ReplyContext): string {
  const currentAgent = context.trace.at(-1)?.agent ?? "Host Concierge";
  return [
    `You are ${currentAgent}, one specialist inside pullup's event activation agent team.`,
    "Your job is to help a host or brand turn a loose event idea into a real gathering.",
    "You are not a generic chatbot. Stay focused on getting people together and moving the event workflow forward.",
    "Write like a calm, socially fluent text message. Be concise.",
    "Avoid sounding like email marketing, CRM software, or a form.",
    "Ask at most one question unless the user asks for a plan.",
    "Do not invent confirmed logistics, venues, dates, or guest commitments.",
    "If the user wants to send real invites, ask for approval before implying anything was sent.",
    "Your reply should be user-facing only. Do not mention internal agent names unless the user asks.",
    "",
    `Current agent: ${currentAgent}`,
    `Current step: ${context.state.step}`,
    `Intent: ${context.intent}`,
    `Draft purpose: ${context.state.draft.purpose ?? "unknown"}`,
    `Draft guests: ${context.state.draft.guests ?? "unknown"}`,
    `Draft vibe: ${context.state.draft.vibe ?? "unknown"}`,
  ].join("\n");
}

function getOpenAiClient(): OpenAI | undefined {
  if (!process.env.OPENAI_API_KEY) return undefined;
  openaiClient ??= new OpenAI();
  return openaiClient;
}

function defaultLlm(): PullupLlm {
  const client = getOpenAiClient();
  if (!client) {
    throw new Error(
      "OPENAI_API_KEY is required. Add it to .env before running pullup.",
    );
  }

  return {
    async generateReply(context) {
      const model = process.env.OPENAI_MODEL ?? "gpt-5.5";
      const response = await client.responses.create({
        model,
        instructions: systemPromptFor(context),
        input: [
          ...context.state.history.slice(-8).map((item) => ({
            role: item.role,
            content: item.content,
          })),
          {
            role: "user" as const,
            content: context.userText,
          },
        ],
      });

      return response.output_text.trim() || context.fallback;
    },
  };
}

function formatTrace(trace: AgentTraceStep[]): string {
  return [
    "[agent trace]",
    ...trace.map((step) => `- ${step.agent}: ${step.action}`),
    "",
  ].join("\n");
}

async function reply(context: ReplyContext): Promise<AgentResponse> {
  const llm = llmOverride ?? defaultLlm();
  const generatedText = await llm.generateReply(context);
  const text =
    process.env.PULLUP_SHOW_AGENT_TRACE === "0"
      ? generatedText
      : `${formatTrace(context.trace)}${generatedText}`;

  context.state.history.push({ role: "user", content: context.userText });
  context.state.history.push({ role: "assistant", content: text });

  return { text };
}

export function setPullupLlmForTesting(llm: PullupLlm | undefined): void {
  llmOverride = llm;
}

export async function runPullupAgent(
  input: AgentInput,
): Promise<AgentResponse> {
  const state = getState(input.conversationId);
  const text = input.text.trim();

  if (!text) {
    return reply({
      state,
      userText: text,
      intent: "empty",
      trace: [
        {
          agent: "Host Concierge",
          action: "Wait for the host to describe the gathering.",
        },
      ],
      fallback:
        "Say what you want to put together, and I’ll help turn it into a real plan.",
    });
  }

  if (["reset", "/reset"].includes(text.toLowerCase())) {
    conversations.delete(input.conversationId);
    const fresh = getState(input.conversationId);
    return reply({
      state: fresh,
      userText: text,
      intent: "reset",
      trace: [
        {
          agent: "Host Concierge",
          action: "Clear the conversation and restart intake.",
        },
      ],
      fallback: "Reset. What are we trying to pull together?",
    });
  }

  if (state.step === "idle") {
    if (!looksLikeEventStart(text)) {
      return reply({
        state,
        userText: text,
        intent: "clarify_event",
        trace: [
          {
            agent: "Host Concierge",
            action: "Clarify whether the user wants to create a gathering.",
          },
        ],
        fallback:
          "pullup here. Tell me what you want to bring people out for: dinner, launch, meetup, party, or something messier.",
      });
    }

    state.draft.purpose = text;
    state.step = "collecting_guests";
    return reply({
      state,
      userText: text,
      intent: "ask_guests",
      trace: [
        {
          agent: "Host Concierge",
          action: "Capture the event intent.",
        },
        {
          agent: "Event Strategist",
          action: "Identify the first missing planning input: audience.",
        },
      ],
      fallback:
        "Got it. Who should come? You can give me names, a group, or a rough audience.",
    });
  }

  if (state.step === "collecting_guests") {
    state.draft.guests = text;
    state.step = "collecting_vibe";
    return reply({
      state,
      userText: text,
      intent: "ask_vibe",
      trace: [
        {
          agent: "Host Concierge",
          action: "Capture the target audience.",
        },
        {
          agent: "Event Strategist",
          action: "Ask for tone and format before drafting.",
        },
      ],
      fallback:
        "Cool. What’s the vibe: intimate dinner, casual hang, brand activation, founder meetup, campus event, or something else?",
    });
  }

  if (state.step === "collecting_vibe") {
    state.draft.vibe = text;
    state.step = "draft_ready";
    return reply({
      state,
      userText: text,
      intent: "show_draft",
      trace: [
        {
          agent: "Event Strategist",
          action: "Convert the brief into a workable event concept.",
        },
        {
          agent: "Invite Copy",
          action: "Prepare the first host-facing invite draft.",
        },
        {
          agent: "Safety & Trust",
          action: "Keep the draft approval-gated; no invite is sent yet.",
        },
      ],
      fallback: [
        "Here’s the first pullup draft:",
        "",
        `Who: ${state.draft.guests}`,
        `What: ${state.draft.purpose}`,
        `Vibe: ${state.draft.vibe}`,
        "",
        "Next I’d ask for date/time, venue constraints, and whether this should feel like a friend text or a brand invite.",
      ].join("\n"),
    });
  }

  if (state.step === "draft_ready") {
    return reply({
      state,
      userText: text,
      intent: "tighten_draft",
      trace: [
        {
          agent: "Host Concierge",
          action: "Collect refinements after the first draft.",
        },
        {
          agent: "Invite Copy",
          action: "Tighten the invitation flow based on new constraints.",
        },
      ],
      fallback:
        "I have the rough pullup. Send date/time, venue, or audience constraints and I’ll tighten the invite flow.",
    });
  }

  return reply({
    state,
    userText: text,
    intent: "clarify_event",
    trace: [
      {
        agent: "Host Concierge",
        action: "Recover the conversation and ask for the next event input.",
      },
    ],
    fallback: "I’m here. What are we trying to pull together?",
  });
}
