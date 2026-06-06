import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  recordInviteSendResult,
  runPullupAgent,
  setPullupLlmForTesting,
  setPullupStoreForTesting,
} from "./agent";
import { PullupStore } from "./store/sqlite";

let store: PullupStore;

function input(conversationId: string, text: string, channel: "terminal" | "imessage" = "terminal") {
  return {
    conversationId,
    text,
    channel,
  };
}

async function sendHost(text: string) {
  return runPullupAgent(input("Terminal:host", text));
}

async function completeEventBrief() {
  await sendHost("Vibe Coding Workshop for PMs & Designers next thursday, in-person, 20 people");
  await sendHost("free");
  await sendHost("Product managers, UI/UX designers, and product designers");
  await sendHost("Help them build real AI prototypes faster without waiting for an engineering team");
  await sendHost("They will learn Cursor, Replit, AI prototyping patterns, and shareable prototype workflows");
  await sendHost("They will build a computer vision app flow and test a working prototype");
  await sendHost("Save your seat");
  await sendHost("Taipei founder space");
  return sendHost("Alex +886976964336, Sam +886912345678");
}

describe("runPullupAgent", () => {
  beforeEach(() => {
    store = new PullupStore(":memory:");
    setPullupStoreForTesting(store);
    setPullupLlmForTesting({
      async generateReply(context) {
        return context.fallback;
      },
    });
  });

  afterEach(() => {
    setPullupLlmForTesting(undefined);
    setPullupStoreForTesting(undefined);
    store.close();
  });

  test("collects Linear event template fields and creates an approval-gated draft", async () => {
    const first = await sendHost("I want to run a Vibe Coding Workshop next thursday for 20 designers");
    expect(first.text).toContain("[agent trace]");
    expect(first.text).toContain("Host Concierge");
    expect(first.text).toContain("online, in-person, or hybrid");

    const draft = await completeEventBrief();
    expect(draft.text).toContain("Current pullup draft");
    expect(draft.text).toContain("Vibe Coding Workshop");
    expect(draft.text).toContain("Invite draft");
    expect(draft.text).toContain("/approve");
  });

  test("blocks send before approval, then queues approved small-batch invites", async () => {
    await completeEventBrief();

    const blocked = await sendHost("/send");
    expect(blocked.text).toContain("reply /approve first");

    const approved = await sendHost("/approve");
    expect(approved.text).toContain("Approved");

    const send = await sendHost("/send");
    expect(send.text).toContain("Queued 2 invites");
    expect(send.outboundInvites).toHaveLength(2);
    expect(send.outboundInvites?.[0]?.phone).toBe("+886976964336");
  });

  test("records target-not-allowed failures without crashing the batch", async () => {
    await completeEventBrief();
    await sendHost("/approve");
    const send = await sendHost("/send");
    const firstInvite = send.outboundInvites![0]!;

    recordInviteSendResult(firstInvite.guestId, "target_not_allowed");

    const status = await sendHost("/status");
    expect(status.text).toContain("Send failures: 1");
  });

  test("guest replies update RSVP status", async () => {
    await completeEventBrief();
    await sendHost("/approve");
    const send = await sendHost("/send");
    const invite = send.outboundInvites![0]!;
    recordInviteSendResult(invite.guestId, "sent");

    const guestReply = await runPullupAgent(
      input("iMessage:any;-;+886976964336", "yes, save me a seat", "imessage"),
    );
    expect(guestReply.text).toContain("confirmed");

    const status = await sendHost("/status");
    expect(status.text).toContain("Confirmed: 1");
  });

  test("guest stop opts out", async () => {
    await completeEventBrief();
    await sendHost("/approve");
    const send = await sendHost("/send");
    const invite = send.outboundInvites![0]!;
    recordInviteSendResult(invite.guestId, "sent");

    const guestReply = await runPullupAgent(
      input("iMessage:any;-;+886976964336", "stop", "imessage"),
    );
    expect(guestReply.text).toContain("won't message you");

    const status = await sendHost("/status");
    expect(status.text).toContain("Opted out: 1");
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
