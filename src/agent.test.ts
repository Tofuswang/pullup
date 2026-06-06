import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { runPullupAgent, setPullupLlmForTesting } from "./agent";

function input(conversationId: string, text: string) {
  return {
    conversationId,
    text,
    channel: "terminal" as const,
  };
}

describe("runPullupAgent", () => {
  beforeEach(() => {
    setPullupLlmForTesting({
      async generateReply(context) {
        return context.fallback;
      },
    });
  });

  afterEach(() => {
    setPullupLlmForTesting(undefined);
  });

  test("guides a host from loose event idea to first pullup draft", async () => {
    const conversationId = "test:event-flow";

    const first = await runPullupAgent(
      input(conversationId, "help me host a founder dinner next thursday"),
    );
    expect(first.text).toContain("[agent trace]");
    expect(first.text).toContain("Host Concierge");
    expect(first.text).toContain("Event Strategist");
    expect(first.text).toContain("Who should come?");

    const guests = await runPullupAgent(
      input(conversationId, "seed founders and product leaders in taipei"),
    );
    expect(guests.text).toContain("What’s the vibe");

    const draft = await runPullupAgent(
      input(conversationId, "intimate dinner, useful but not salesy"),
    );
    expect(draft.text).toContain("Invite Copy");
    expect(draft.text).toContain("Safety & Trust");
    expect(draft.text).toContain("Here’s the first pullup draft");
    expect(draft.text).toContain("Who: seed founders and product leaders in taipei");
    expect(draft.text).toContain(
      "What: help me host a founder dinner next thursday",
    );
    expect(draft.text).toContain("Vibe: intimate dinner, useful but not salesy");
  });

  test("does not start an event flow from unrelated chatter", async () => {
    const response = await runPullupAgent(input("test:chatter", "hello"));

    expect(response.text).toContain("Tell me what you want to bring people out for");
  });

  test("reset clears conversation state", async () => {
    const conversationId = "test:reset";

    await runPullupAgent(input(conversationId, "plan a launch party"));
    const reset = await runPullupAgent(input(conversationId, "/reset"));
    expect(reset.text).toContain("Reset");

    const afterReset = await runPullupAgent(input(conversationId, "alex and sam"));
    expect(afterReset.text).toContain("Tell me what you want to bring people out for");
  });

  test("uses the configured LLM when available", async () => {
    setPullupLlmForTesting({
      async generateReply(context) {
        return `llm:${context.intent}:${context.state.step}`;
      },
    });

    const response = await runPullupAgent(
      input("test:llm", "help me host a supper club"),
    );

    expect(response.text).toContain("llm:ask_guests:collecting_guests");
  });

  test("loops through local iPhone Calendar availability after approval", async () => {
    const conversationId = "test:calendar-loop";

    await runPullupAgent(input(conversationId, "help me host a coffee meetup"));
    await runPullupAgent(input(conversationId, "Vivian and two product friends"));
    await runPullupAgent(input(conversationId, "cozy but useful"));

    const calendar = await runPullupAgent(input(conversationId, "YES"));
    expect(calendar.text).toContain("iPhone Calendar");
    expect(calendar.text).toContain("Apple Maps");

    const slots = await runPullupAgent(input(conversationId, "Thu 7:30 PM, Sat 3 PM"));
    expect(slots.text).toContain("I found a few windows");
    expect(slots.text).toContain("Reply 1, 2, or 3");

    const selected = await runPullupAgent(input(conversationId, "1"));
    expect(selected.text).toContain("Reply CREATE HOLD");

    const created = await runPullupAgent(input(conversationId, "CREATE HOLD"));
    expect(created.text).toContain("Local room hold prepared");
    expect(created.text).toContain("maps.apple.com");
  });

  test("requires explicit event creation after slot selection", async () => {
    const conversationId = "test:calendar-approval";

    await runPullupAgent(input(conversationId, "plan a dinner"));
    await runPullupAgent(input(conversationId, "friends"));
    await runPullupAgent(input(conversationId, "low key"));
    await runPullupAgent(input(conversationId, "YES"));
    await runPullupAgent(input(conversationId, "Thu 7:30 PM, Sat 3 PM"));
    await runPullupAgent(input(conversationId, "1"));

    const response = await runPullupAgent(input(conversationId, "ok"));
    expect(response.text).toContain("No hold is created yet");
  });
});
