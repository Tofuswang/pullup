import { C, bg, footer, kicker, panel, statusPill, title } from "./common.mjs";

export async function slide09(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  kicker(slide, ctx, "METHODOLOGY MAP");
  title(slide, ctx, "The pitch is strong because the MVP says what is real and what is next.");

  const rows = [
    ["Invite-only funnel", "implemented", "START opens first-circle invite flow"],
    ["LinkedIn verification", "simulated", "URL validation only; no scraping"],
    ["AI Passport", "implemented", "redaction + approval before matching"],
    ["Room recommendation", "simulated", "heuristic dyadic / group / experience scores"],
    ["Local iOS scheduling", "implemented", "free-window handoff + Calendar-ready card"],
    ["Native iOS app brain", "future", "EventKit, MapKit, Contacts, App Intents"],
  ];
  panel(slide, ctx, { left: 72, top: 226, width: 1080, height: 390 }, { fill: C.white });
  ctx.addText(slide, { text: "Claim", left: 104, top: 250, width: 300, height: 20, fontSize: 13, bold: true, color: C.steel });
  ctx.addText(slide, { text: "Status", left: 430, top: 250, width: 150, height: 20, fontSize: 13, bold: true, color: C.steel });
  ctx.addText(slide, { text: "MVP evidence", left: 610, top: 250, width: 360, height: 20, fontSize: 13, bold: true, color: C.steel });
  rows.forEach(([claim, status, evidence], i) => {
    const y = 292 + i * 54;
    ctx.addShape(slide, { left: 96, top: y - 14, width: 1012, height: 1, fill: i === 0 ? "#00000000" : C.line });
    ctx.addText(slide, { text: claim, left: 104, top: y, width: 286, height: 22, fontSize: 17, bold: true, color: C.ink });
    statusPill(slide, ctx, status, 424, y - 4);
    ctx.addText(slide, { text: evidence, left: 610, top: y, width: 470, height: 22, fontSize: 16, color: C.steel });
  });

  ctx.addText(slide, {
    text: "Use the live command: METHODOLOGY",
    left: 84,
    top: 642,
    width: 380,
    height: 24,
    fontSize: 18,
    bold: true,
    color: C.coral,
  });
  footer(slide, ctx, 9, "Source: src/methodology_map.ts + src/commonground_methodology.ts");
  return slide;
}
