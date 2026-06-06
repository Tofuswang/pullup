import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { systemPromptFor } from "../agent";
import { runCommonGroundAgent } from "../commonground";
import { type PullupEvent } from "../domain";
import { PullupStore } from "../store/sqlite";
import { buildAgentContext } from "./context";
import {
  formatRuntimeDocsContext,
  loadRuntimeDocsContext,
  resetRuntimeDocsCacheForTesting,
  runtimeDocsPrompt,
  setRuntimeDocsContextForTesting,
} from "./docs";
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
    setRuntimeDocsContextForTesting(undefined);
    resetRuntimeDocsCacheForTesting();
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

  test("runtime docs loader reads only whitelisted product docs", () => {
    const root = makeDocsRoot({
      "AGENTS.md": "# Do not load me\npoison dev instructions",
      "README.md": "# Do not load me\nrepo setup notes",
      "docs/collaboration.md": "# Do not load me\ncredential workflow",
      "docs/agent-architecture.md": "## Design Principle\nUse one orchestrator.\n\n## Ignored\nNope",
      "docs/commonground-business-flow-v2.md": "## CommonGround Member Flow\nSTART owns onboarding.",
      "docs/ios-local-integrations.md": "## MVP Decision\nUse local iOS handoff.",
    });

    const context = loadRuntimeDocsContext(root);
    const prompt = formatRuntimeDocsContext(context);

    expect(context.loadedFiles).toEqual([
      "docs/agent-architecture.md",
      "docs/commonground-business-flow-v2.md",
      "docs/ios-local-integrations.md",
    ]);
    expect(prompt).toContain("Use one orchestrator");
    expect(prompt).toContain("START owns onboarding");
    expect(prompt).toContain("Use local iOS handoff");
    expect(prompt).not.toContain("poison dev instructions");
    expect(prompt).not.toContain("credential workflow");
  });

  test("runtime docs loader does not crash when docs are missing", () => {
    const root = mkdtempSync(join(tmpdir(), "pullup-docs-missing-"));

    const context = loadRuntimeDocsContext(root);
    const prompt = formatRuntimeDocsContext(context);

    expect(context.loadedFiles).toEqual([]);
    expect(context.warnings).toHaveLength(3);
    expect(prompt).toContain("Loaded docs: none");
  });

  test("runtime docs prompt can be disabled and capped by env", () => {
    setRuntimeDocsContextForTesting({
      runtimeRules: "A".repeat(100),
      commongroundRules: "B".repeat(100),
      iosHandoffRules: "C".repeat(100),
      warnings: [],
      loadedFiles: ["docs/agent-architecture.md"],
    });

    expect(runtimeDocsPrompt({ env: { PULLUP_DOCS_CONTEXT: "0" } })).toBe("");
    expect(runtimeDocsPrompt({ env: { PULLUP_DOCS_MAX_CHARS: "80" } }).length).toBeLessThanOrEqual(80);
    expect(runtimeDocsPrompt({ env: { PULLUP_DOCS_MAX_CHARS: "80" } })).toContain("truncated");
  });

  test("system prompt places runtime docs before durable memory", () => {
    const prompt = systemPromptFor({
      userText: "hello",
      intent: "host_intake",
      fallback: "ok",
      trace: [],
      memory: {
        docsContext: "# Runtime Product Rules\nUse one orchestrator.",
        eventBrief: "Title: Durable Event",
        guestSummary: "No guests yet.",
        recentMessages: "inbound/imessage: hello",
      },
    });

    expect(prompt).toContain("# Runtime Product Rules");
    expect(prompt.indexOf("# Runtime Product Rules")).toBeLessThan(
      prompt.indexOf("Current durable memory:"),
    );
  });
});

function makeDocsRoot(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "pullup-docs-"));
  for (const [relativePath, content] of Object.entries(files)) {
    const path = join(root, relativePath);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
  return root;
}
