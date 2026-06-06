import { Spectrum } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";
import { terminal } from "spectrum-ts/providers/terminal";
import { runPullupAgent, type AgentInput } from "./agent";

const providerMode = process.env.PULLUP_PROVIDERS ?? "terminal";
const telemetryEnabled = process.env.PULLUP_SPECTRUM_TELEMETRY !== "0";
const providers = [];

if (providerMode === "terminal" || providerMode === "both") {
  providers.push(terminal.config());
}

if (providerMode === "imessage" || providerMode === "both") {
  providers.push(imessage.config());
}

if (providers.length === 0) {
  throw new Error(
    `Unsupported PULLUP_PROVIDERS="${providerMode}". Use terminal, imessage, or both.`,
  );
}

console.log(
  `[pullup] starting providers=${providerMode} model=${process.env.OPENAI_MODEL ?? "gpt-5.5"} telemetry=${telemetryEnabled ? "on" : "off"}`,
);

// Spectrum bridges a single agent loop to many messaging interfaces.
// Each provider in `providers` adds an interface (terminal TUI, iMessage, …).
// Docs: https://photon.codes/docs/spectrum-ts
const app = await Spectrum({
  projectId: process.env.PROJECT_ID!,
  projectSecret: process.env.PROJECT_SECRET!,
  providers,
  telemetry: telemetryEnabled,
});

// `app.messages` is an async iterable. Each tick yields a `space` (the
// conversation) and an inbound `message`. Reply by awaiting `space.send(...)`.
for await (const [space, message] of app.messages) {
  if (message.content.type === "text") {
    console.log(
      `[pullup] inbound platform=${space.__platform} space=${space.id} message=${message.id}`,
    );

    const input: AgentInput = {
      conversationId: `${space.__platform}:${space.id}`,
      text: message.content.text,
      channel:
        space.__platform === "Terminal"
          ? "terminal"
          : space.__platform === "iMessage"
            ? "imessage"
            : "unknown",
    };

    const response = await runPullupAgent(input);
    await space.send(response.text);
    console.log(`[pullup] outbound platform=${space.__platform} space=${space.id}`);
  }
}
