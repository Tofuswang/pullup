import { afterEach, describe, expect, test } from "bun:test";
import { runCommonGroundAgent } from "../commonground";
import { type PullupEvent } from "../domain";
import { PullupStore } from "../store/sqlite";
import { buildAgentContext } from "./context";
import {
  canSendInvites,
  inviteBatchLimit,
  sendFailureStatusFromError,
} from "./policies";
import { routeNameForCommonGround, routeAgentInput } from "./router";

const stores: PullupStore[] = [];

function makeStore() {
  const store = new PullupStore(":memory:");
  stores.push(store);
  return store;
}

function input(conversationId: string, text: string, channel: "terminal" | "imessage" = "terminal") {
  return { conversationId, text, channel };
}

describe("agent harness", () => {
  afterEach(() => {
    for (const store of stores.splice(0)) store.close();
  });

  test("routes START through CommonGround before the host flow", () => {
    const response = runCommonGroundAgent(input("iMessage:harness-cg", "START", "imessage"));

    expect(routeNameForCommonGround(Boolean(response))).toBe("commonground");
    expect(response?.text).toContain("CommonGround");
  });

  test("routes a matched guest phone to RSVP, not host intake", () => {
    const store = makeStore();
    const event = store.getOrCreateDraftEvent("Terminal:host");
    store.replaceGuests(event.id, [{ name: "Alex", phone: "+886976964336" }]);

    const context = routeAgentInput(
      buildAgentContext(
        input("iMessage:any;-;+886976964336", "yes", "imessage"),
        store,
      ),
    );

    expect(context.route).toBe("guest_rsvp");
    expect(context.guest?.phone).toBe("+886976964336");
  });

  test("routes host slash commands as commands", () => {
    const store = makeStore();
    const commands = [
      ["/status", "status"],
      ["/approve", "approve"],
      ["/send", "send"],
      ["/reset", "reset"],
      ["/clear", "clear"],
    ] as const;

    for (const [text, command] of commands) {
      const context = routeAgentInput(buildAgentContext(input("Terminal:host", text), store));

      expect(context.route).toBe("host_command");
      expect(context.command).toBe(command);
    }
  });

  test("context builder includes event brief, guests, and recent messages", () => {
    const store = makeStore();
    const event = store.updateEvent(store.getOrCreateDraftEvent("Terminal:host").id, {
      title: "圓山約會",
      date: "週日下午",
      format: "in-person",
      venueOrLocation: "圓山",
      guestListRaw: "Alex +886976964336",
    }) as PullupEvent;
    store.replaceGuests(event.id, [{ name: "Alex", phone: "+886976964336" }]);
    store.logMessage({
      eventId: event.id,
      conversationId: "Terminal:host",
      direction: "inbound",
      channel: "terminal",
      body: "我想規劃一場約會，週日下午在圓山",
    });

    const context = buildAgentContext(input("Terminal:host", "/draft"), store);

    expect(context.memory?.eventBrief).toContain("Title: 圓山約會");
    expect(context.memory?.eventBrief).toContain("Date: 週日下午");
    expect(context.memory?.guestSummary).toContain("Total guests: 1");
    expect(context.memory?.recentMessages).toContain("我想規劃一場約會");
  });

  test("policies block send before approval and allow after approval", () => {
    expect(canSendInvites("needs_approval")).toMatchObject({
      allow: false,
      fallback: expect.stringContaining("/approve"),
    });
    expect(canSendInvites("approved")).toEqual({ allow: true });
  });

  test("policies keep batch limit and target-not-allowed mapping stable", () => {
    expect(inviteBatchLimit({ PULLUP_MAX_INVITES_PER_BATCH: "7" })).toBe(7);
    expect(inviteBatchLimit({ PULLUP_MAX_INVITES_PER_BATCH: "bad" })).toBe(20);
    expect(sendFailureStatusFromError(new Error("Target not allowed for this project"))).toBe("target_not_allowed");
    expect(sendFailureStatusFromError(new Error("network failed"))).toBe("failed");
  });
});
