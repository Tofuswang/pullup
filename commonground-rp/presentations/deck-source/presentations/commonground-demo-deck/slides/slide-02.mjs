import { C, bg, body, footer, kicker, panel, title } from "./common.mjs";

export async function slide02(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  kicker(slide, ctx, "PROBLEM");
  title(slide, ctx, "Social apps optimize browsing. CommonGround optimizes the first hour.");

  const left = [
    ["Thin profiles", "performative identity, shallow preferences"],
    ["One-sided matching", "a person is treated like content"],
    ["Awkward first meet", "no shared object or safe structure"],
    ["Coordination drag", "calendar, venue, travel, RSVP chaos"],
  ];
  left.forEach(([h, s], i) => {
    const y = 226 + i * 82;
    panel(slide, ctx, { left: 64, top: y, width: 448, height: 72 }, { fill: "#FFFFFF" });
    ctx.addText(slide, { text: h, left: 86, top: y + 10, width: 390, height: 22, fontSize: 17, bold: true, color: C.ink });
    ctx.addText(slide, { text: s, left: 86, top: y + 34, width: 380, height: 20, fontSize: 14, color: C.steel });
  });

  ctx.addShape(slide, { left: 570, top: 206, width: 2, height: 374, fill: C.line });
  ctx.addText(slide, {
    text: "Product inversion",
    left: 628,
    top: 218,
    width: 270,
    height: 30,
    fontSize: 22,
    bold: true,
    color: C.sageDark,
  });

  const right = [
    ["Verified trust", "LinkedIn URL only as true-person handle"],
    ["AI Passport", "user-approved taste and conversation signals"],
    ["Room design", "people + activity + venue + context card"],
    ["Local handoff", "iPhone Calendar-ready card + Apple Maps link"],
  ];
  right.forEach(([h, s], i) => {
    const y = 278 + i * 70;
    ctx.addShape(slide, { left: 630, top: y + 8, width: 14, height: 14, fill: C.coral });
    ctx.addText(slide, { text: h, left: 662, top: y, width: 230, height: 24, fontSize: 18, bold: true, color: C.ink });
    ctx.addText(slide, { text: s, left: 662, top: y + 28, width: 430, height: 24, fontSize: 15, color: C.steel });
  });

  body(
    slide,
    ctx,
    "The demo proves a narrow outcome: can this room create enough trust, common ground, and comfort to be worth showing up for?",
    { left: 810, top: 592, width: 370, height: 60 },
    { size: 17, color: C.ink, bold: true },
  );
  footer(slide, ctx, 2, "Source: README + docs/commonground-business-flow-v2.md");
  return slide;
}
