import { C, arrow, bg, footer, kicker, panel, title } from "./common.mjs";

export async function slide03(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  kicker(slide, ctx, "LIVE FLOW");
  title(slide, ctx, "The GitHub branch now supports the full CommonGround member journey.");

  const steps = [
    ["START", "private invite"],
    ["CONSENT", "data boundary"],
    ["LinkedIn", "true-person handle"],
    ["AI Passport", "user-approved memory"],
    ["APPROVE", "redaction loop"],
    ["Preferences", "intent + constraints"],
    ["Room drop", "context card"],
    ["YES", "mutual opt-in"],
    ["Free windows", "slot overlap"],
    ["CONFIRM", "calendar + maps"],
    ["Feedback", "vibe tuning"],
  ];

  steps.forEach(([h, s], i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = 66 + col * 296;
    const y = 230 + row * 142;
    panel(slide, ctx, { left: x, top: y, width: 238, height: 72 }, { fill: i === 6 ? "#F4E5D3" : C.white });
    ctx.addText(slide, { text: h, left: x + 18, top: y + 12, width: 200, height: 25, fontSize: 20, bold: true, color: i === 6 ? "#955D35" : C.ink });
    ctx.addText(slide, { text: s, left: x + 18, top: y + 38, width: 200, height: 18, fontSize: 13, color: C.steel });
    if (i < steps.length - 1) {
      const nextCol = (i + 1) % 4;
      const nextRow = Math.floor((i + 1) / 4);
      if (row === nextRow) arrow(slide, ctx, x + 242, y + 36, x + 286, y + 36, C.line);
    }
  });
  arrow(slide, ctx, 66 + 3 * 296 + 120, 302, 66 + 3 * 296 + 120, 372, C.line);
  arrow(slide, ctx, 66 + 3 * 296 + 120, 444, 66 + 3 * 296 + 120, 514, C.line);

  ctx.addText(slide, {
    text: "Protocol-owned onboarding prevents the host/invite agent from chiming in during CommonGround.",
    left: 76,
    top: 606,
    width: 730,
    height: 50,
    fontSize: 18,
    bold: true,
    color: C.sageDark,
  });
  footer(slide, ctx, 3, "Source: src/commonground.ts + src/agent.test.ts");
  return slide;
}
