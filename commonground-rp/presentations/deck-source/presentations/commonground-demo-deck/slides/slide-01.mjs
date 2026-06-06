import { C, bg, body, chip, footer } from "./common.mjs";

export async function slide01(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx, C.charcoal);

  ctx.addShape(slide, { left: 54, top: 52, width: 46, height: 4, fill: C.gold });
  ctx.addText(slide, {
    text: "COMMONGROUND",
    left: 112,
    top: 39,
    width: 320,
    height: 32,
    fontSize: 15,
    bold: true,
    color: C.gold,
  });

  ctx.addText(slide, {
    text: "A recommender system for designing the first offline hour.",
    left: 54,
    top: 132,
    width: 860,
    height: 166,
    fontSize: 54,
    bold: true,
    typeface: ctx.fonts.title,
    color: C.paper,
  });

  body(
    slide,
    ctx,
    "We do not recommend people. We recommend a room: the people, activity, venue, and context that make showing up feel safe and worthwhile.",
    { left: 58, top: 332, width: 720, height: 88 },
    { color: "#DDE8DB", size: 23 },
  );

  const badges = [
    ["Spectrum / iMessage", "implemented"],
    ["AI Passport", "implemented"],
    ["Room recommender", "implemented"],
    ["iOS handoff", "MVP"],
    ["Vibe learning", "MVP"],
  ];
  badges.forEach(([label, state], i) => {
    chip(slide, ctx, label, 58 + i * 175, 470, 154, {
      fill: state === "implemented" ? "#DDE8DB" : "#F4E5D3",
      color: state === "implemented" ? C.sageDark : "#955D35",
    });
  });

  ctx.addShape(slide, { left: 910, top: 116, width: 1, height: 450, fill: "#52615B" });
  const stats = [
    ["37", "passing tests"],
    ["6", "test files"],
    ["10", "MVP claims mapped"],
  ];
  stats.forEach(([num, label], i) => {
    ctx.addText(slide, {
      text: num,
      left: 960,
      top: 154 + i * 128,
      width: 130,
      height: 50,
      fontSize: 42,
      bold: true,
      color: C.gold,
      typeface: ctx.fonts.title,
    });
    ctx.addText(slide, {
      text: label,
      left: 960,
      top: 222 + i * 128,
      width: 210,
      height: 26,
      fontSize: 18,
      color: "#DDE8DB",
    });
  });

  footer(slide, ctx, 1, "PR #3 branch: feature/research-matching-calendar-loop");
  return slide;
}
