// One-shot OUTBOUND test: make the agent proactively text a number,
// to isolate whether the line works outbound (vs the broken inbound routing).
import { Spectrum } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";

const TARGET = process.env.IMESSAGE_TEST_TARGET;

if (!TARGET) {
  throw new Error("Set IMESSAGE_TEST_TARGET to an allowed iMessage target.");
}

const app = await Spectrum({
  projectId: process.env.PROJECT_ID!,
  projectSecret: process.env.PROJECT_SECRET!,
  providers: [imessage.config()],
});

try {
  const im = imessage(app);
  const user = await im.user(TARGET);
  const dm = await im.space(user);
  await dm.send("ping from agent 👋 (outbound test)");
  console.log("[send-test] sent OK to", TARGET);
} catch (err) {
  console.error("[send-test] FAILED:", err);
} finally {
  await app.stop?.();
  process.exit(0);
}
