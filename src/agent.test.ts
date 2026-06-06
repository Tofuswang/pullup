import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  type PullupLlm,
  recordInviteSendResult,
  runPullupAgent,
  setPullupLlmForTesting,
  setPullupMapsForTesting,
  setPullupStoreForTesting,
} from "./agent";
import { PullupStore } from "./store/sqlite";

let store: PullupStore;
let seenContexts: Parameters<PullupLlm["generateReply"]>[0][];

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
  await sendHost("Taipei founder space");
  return sendHost("Alex +886976964336, Sam +886912345678");
}

describe("runPullupAgent", () => {
  beforeEach(() => {
    store = new PullupStore(":memory:");
    seenContexts = [];
    setPullupStoreForTesting(store);
    setPullupLlmForTesting({
      async generateReply(context) {
        seenContexts.push(context);
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
    expect(first.text).toContain("in person, online, or hybrid");

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

    expect(response.text).toContain("When should it happen?");
    expect(response.text.toLowerCase()).not.toContain("city");
    expect(response.text.toLowerCase()).not.toContain("neighborhood");
  });

  test("uses iOS location handoff when the venue field is missing", async () => {
    await sendHost("Coffee meetup tomorrow, in-person, 4 people");
    await sendHost("free");
    await sendHost("NTU students and alumni");

    const locationPrompt = await sendHost("RSVP yes");

    expect(locationPrompt.text).toContain("Where should this happen?");
    expect(locationPrompt.text).toContain("Messages location share");
  });

  test("runs CommonGround onboarding from invite to room confirmation", async () => {
    const conversationId = "iMessage:commonground-user";

    const start = await runPullupAgent(input(conversationId, "START", "imessage"));
    expect(start.text).toContain("small first circle invited to CommonGround");
    expect(start.text).toContain("Reply CONSENT");

    const consent = await runPullupAgent(input(conversationId, "CONSENT", "imessage"));
    expect(consent.text).toContain("LinkedIn URL");
    expect(consent.text).toContain("true-person verification");

    const linkedin = await runPullupAgent(
      input(conversationId, "https://www.linkedin.com/in/vivian-chao-9a0b54198/", "imessage"),
    );
    expect(linkedin.text).toContain("Verified as a consented identity handle");
    expect(linkedin.text).toContain("AI Passport");

    const passport = await runPullupAgent(
      input(
        conversationId,
        "I am an ambivert with extroverted curiosity. I enjoy AI tools, startups, finance, psychology, books, city walks, quiet cafes, thoughtful conversation, and low-pressure first meetings. Avoid loud bars, forced networking, and contact exchange before mutual comfort.",
        "imessage",
      ),
    );
    expect(passport.text).toContain("plain-language matching preview");
    expect(passport.text).toContain("Reply APPROVE");

    const approved = await runPullupAgent(input(conversationId, "APPROVE", "imessage"));
    expect(approved.text).toContain("explicit preferences");
    expect(approved.text).toContain("availability");

    const preferences = await runPullupAgent(
      input(
        conversationId,
        "open to dating/social, Thu evening or Sun afternoon, NT$800-1500, Da'an/Xinyi, no alcohol-heavy first meet, group of 4, contact exchange only after mutual comfort",
        "imessage",
      ),
    );
    expect(preferences.text).toContain("Your weekly room drop is ready");
    expect(preferences.text).toContain("People: you +");
    expect(preferences.text).toContain("Reply YES, MAYBE, or SKIP");

    const yes = await runPullupAgent(input(conversationId, "YES", "imessage"));
    expect(yes.text).toContain("Check your iPhone Calendar");

    const slot = await runPullupAgent(input(conversationId, "Thu 7:30 PM, Sat 3 PM", "imessage"));
    expect(slot.text).toContain("Reply CONFIRM ROOM");

    const confirmed = await runPullupAgent(input(conversationId, "CONFIRM ROOM", "imessage"));
    expect(confirmed.text).toContain("Room confirmed");
    expect(confirmed.text).toContain("Calendar event ready");
    expect(confirmed.text).toContain("maps.apple.com");

    const feedback = await runPullupAgent(input(conversationId, "looks good", "imessage"));
    expect(feedback.text).toContain("Vibe feedback");
    expect(feedback.text).not.toContain("rate people");
  });

  test("CommonGround START owns the turn and does not trigger host intake", async () => {
    const conversationId = "iMessage:protocol-owner";

    const start = await runPullupAgent(input(conversationId, "START", "imessage"));

    expect(start.text).toContain("small first circle invited to CommonGround");
    expect(start.text).toContain("Reply CONSENT");
    expect(start.text).not.toContain("Who should this invite go to");
    expect(start.text).not.toContain("Who should be invited");
    expect(start.text).not.toContain("coffee / matcha meetup");
    expect(seenContexts).toHaveLength(0);
    expect(store.getActiveEventForHost(conversationId)).toBeUndefined();
  });

  test("LinkedIn URL is verification only, not an invite target", async () => {
    const conversationId = "iMessage:linkedin-verification";

    const response = await runPullupAgent(
      input(conversationId, "“https://www.linkedin.com/in/vivian-chao-9a0b54198/“", "imessage"),
    );

    expect(response.text).toContain("Verified as a consented identity handle");
    expect(response.text).toContain("AI Passport");
    expect(response.text).not.toContain("Draft note");
    expect(response.text).not.toContain("coffee");
    expect(response.text).not.toContain("invite");
    expect(seenContexts).toHaveLength(0);
    expect(store.getActiveEventForHost(conversationId)).toBeUndefined();
  });

  test("LinkedIn URL during onboarding accepts smart quotes", async () => {
    const conversationId = "iMessage:linkedin-smart-quotes";

    await runPullupAgent(input(conversationId, "START", "imessage"));
    await runPullupAgent(input(conversationId, "CONSENT", "imessage"));
    const response = await runPullupAgent(
      input(conversationId, "“https://www.linkedin.com/in/vivian-chao-9a0b54198/“", "imessage"),
    );

    expect(response.text).toContain("Verified as a consented identity handle");
    expect(response.text).toContain("AI Passport");
    expect(response.text).not.toContain("Please paste your LinkedIn profile URL");
  });

  test("slash start also enters CommonGround without host agent chime-in", async () => {
    const conversationId = "iMessage:slash-start";

    const start = await runPullupAgent(input(conversationId, "/start", "imessage"));

    expect(start.text).toContain("small first circle invited to CommonGround");
    expect(start.text).not.toContain("Who should this invite go to");
    expect(seenContexts).toHaveLength(0);
    expect(store.getActiveEventForHost(conversationId)).toBeUndefined();
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

  test("does not overwrite an approval draft with casual follow-up text", async () => {
    await completeEventBrief();
    const before = store.getActiveEventForHost("Terminal:host")!;

    const response = await sendHost("Hey");
    const after = store.getActiveEventForHost("Terminal:host")!;

    expect(response.text).toContain("waiting for approval");
    expect(after.title).toBe(before.title);
    expect(after.date).toBe(before.date);
    expect(after.inviteDraft).toBe(before.inviteDraft);
  });

  test("allows explicit labeled edits while an approval draft is pending", async () => {
    await completeEventBrief();

    const response = await sendHost("title: Better Workshop");
    const event = store.getActiveEventForHost("Terminal:host")!;

    expect(response.text).toContain("Better Workshop");
    expect(event.title).toBe("Better Workshop");
    expect(event.inviteDraft).toContain("Better Workshop");
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

    const location = await sendHost("Taipei 101");

    expect(location.text).toContain("I found this venue match");
    expect(location.text).toContain("Taipei 101");
    expect(location.text).toContain("25.033976");
  });

  test("understands Chinese date and venue in a date-planning message", async () => {
    setPullupMapsForTesting({
      async searchPlaces(query) {
        expect(query).toBe("圓山");
        return [
          {
            name: "圓山",
            address: "台北市中山區圓山",
            latitude: 25.071,
            longitude: 121.52,
          },
        ];
      },
    });

    const response = await sendHost("我想規劃一場約會，週日下午在圓山");

    expect(response.text).toContain("I found this venue match");
    expect(response.text).toContain("圓山");
    expect(response.text).not.toContain("When is it happening");

    const draft = await sendHost("/draft");
    expect(draft.text).toContain("Title: 圓山約會");
    expect(draft.text).toContain("Date: 週日下午");
    expect(draft.text).toContain("Venue/location: 圓山");
  });

  test("builds a durable memory packet before LLM response", async () => {
    await sendHost("我想規劃一場約會，週日下午在圓山");

    const context = seenContexts.at(-1);
    expect(context?.memory?.eventBrief).toContain("Title: 圓山約會");
    expect(context?.memory?.eventBrief).toContain("Date: 週日下午");
    expect(context?.memory?.eventBrief).toContain("Venue/location: 圓山");
    expect(context?.memory?.recentMessages).toContain("我想規劃一場約會");
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
