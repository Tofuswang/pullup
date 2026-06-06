import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  recordInviteSendResult,
  runPullupAgent,
  setPullupLlmForTesting,
  setPullupMapsForTesting,
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
    setPullupMapsForTesting({
      async searchPlaces() {
        return [];
      },
    });
  });

  afterEach(() => {
    setPullupLlmForTesting(undefined);
    setPullupMapsForTesting(undefined);
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

  test("does not ask for typed location on first coffee meetup message", async () => {
    const response = await runPullupAgent(
      input("test:no-location-first", "plan a coffee meetup"),
    );

    expect(response.text).toContain("When is it happening?");
    expect(response.text.toLowerCase()).not.toContain("city");
    expect(response.text.toLowerCase()).not.toContain("neighborhood");
  });

  test("uses iOS location handoff when the venue field is missing", async () => {
    await sendHost("Coffee meetup tomorrow, in-person, 4 people");
    await sendHost("free");
    await sendHost("NTU students and alumni");
    await sendHost("Meet thoughtful people without swiping");
    await sendHost("They will learn who is building interesting projects nearby");
    await sendHost("They will have structured coffee conversations");

    const locationPrompt = await sendHost("RSVP yes");

    expect(locationPrompt.text).toContain("Share your current/live location in Messages");
    expect(locationPrompt.text).toContain("You do not need to type a neighborhood");
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

  test("venue intake resolves a Google Places candidate", async () => {
    setPullupMapsForTesting({
      async searchPlaces(query) {
        expect(query).toBe("Taipei 101");
        return [
          {
            name: "Taipei 101",
            address: "No. 7, Section 5, Xinyi Rd, Taipei City, Taiwan 110",
            latitude: 25.033976,
            longitude: 121.5645389,
          },
        ];
      },
    });

    await sendHost("Vibe Coding Workshop next thursday, in-person, 20 people");
    await sendHost("free");
    await sendHost("Product builders");
    await sendHost("Meet other builders");
    await sendHost("They will learn AI prototyping");
    await sendHost("They will demo their projects");
    await sendHost("RSVP");

    const location = await sendHost("Taipei 101");

    expect(location.text).toContain("I found this venue match");
    expect(location.text).toContain("Taipei 101");
    expect(location.text).toContain("25.033976");
  });

  test("clear clears terminal output without resetting the event", async () => {
    await sendHost("Vibe Coding Workshop next thursday");

    const clear = await sendHost("/clear");
    expect(clear.text).toStartWith("\x1b[2J\x1b[H");
    expect(clear.text).toContain("still here");

    const draft = await sendHost("/draft");
    expect(draft.text).toContain("Vibe Coding Workshop");
  });
});
