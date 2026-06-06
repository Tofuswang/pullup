import { C, arrow, bg, body, footer, kicker, panel, title } from "./common.mjs";

export async function slide08(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  kicker(slide, ctx, "CODE ARCHITECTURE");
  title(slide, ctx, "One Spectrum agent now has two clean product surfaces.", { height: 104 });

  const modules = [
    ["src/index.ts", "Spectrum provider loop", 86, 250],
    ["src/agent.ts", "top-level routing", 358, 250],
    ["src/commonground.ts", "member onboarding", 672, 210],
    ["src/commonground_recommender.ts", "room + slot logic", 672, 342],
    ["src/ios.ts / calendar.ts", "Calendar + Maps handoff", 672, 474],
    ["pullup host flow", "draft / approve / send / RSVP", 358, 474],
  ];
  modules.forEach(([h, s, x, y], i) => {
    panel(slide, ctx, { left: x, top: y, width: i === 3 ? 292 : 250, height: 88 }, { fill: i >= 2 && i <= 4 ? "#DDE8DB" : C.white });
    ctx.addText(slide, { text: h, left: x + 18, top: y + 12, width: i === 3 ? 252 : 210, height: 38, fontSize: 14, bold: true, color: C.ink });
    ctx.addText(slide, { text: s, left: x + 18, top: y + 58, width: i === 3 ? 252 : 210, height: 18, fontSize: 13, color: C.steel });
  });
  arrow(slide, ctx, 336, 286, 358, 286, C.line);
  arrow(slide, ctx, 608, 286, 672, 246, C.line);
  arrow(slide, ctx, 608, 286, 672, 378, C.line);
  arrow(slide, ctx, 608, 510, 672, 510, C.line);
  arrow(slide, ctx, 796, 282, 796, 342, C.sage);
  arrow(slide, ctx, 796, 414, 796, 474, C.sage);

  panel(slide, ctx, { left: 1000, top: 214, width: 176, height: 220 }, { fill: C.charcoal, line: "#00000000" });
  ctx.addText(slide, { text: "Test proof", left: 1020, top: 238, width: 140, height: 28, fontSize: 22, bold: true, color: C.gold });
  ctx.addText(slide, { text: "37 passing\n0 failures\n160 expects", left: 1020, top: 294, width: 130, height: 94, fontSize: 22, bold: true, color: C.paper });

  body(slide, ctx, "The CommonGround protocol owns its onboarding turns, so host-drafting logic does not interrupt the member flow.", { left: 94, top: 604, width: 740, height: 42 }, { size: 18, bold: true, color: C.sageDark });
  footer(slide, ctx, 8, "Source: README + src/agent.ts + test suite");
  return slide;
}
