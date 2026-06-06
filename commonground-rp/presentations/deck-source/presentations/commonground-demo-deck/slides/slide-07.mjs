import { C, bg, body, footer, kicker, panel, title } from "./common.mjs";

export async function slide07(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  kicker(slide, ctx, "SCHEDULING LOOP");
  title(slide, ctx, "For the demo, calendar truth comes from local iPhone free windows.");

  const rows = [
    ["you", [250, 450], C.coral],
    ["Mina", [300, 520], C.sage],
    ["Ethan", [330, 500], C.gold],
  ];
  panel(slide, ctx, { left: 86, top: 222, width: 760, height: 348 }, { fill: C.white });
  ctx.addText(slide, { text: "Thu evening overlap", left: 120, top: 248, width: 300, height: 28, fontSize: 23, bold: true, color: C.ink });
  ctx.addShape(slide, { left: 218, top: 316, width: 560, height: 2, fill: C.line });
  ["6:00", "7:00", "7:30", "8:30", "9:00"].forEach((t, i) => {
    const x = 218 + i * 140;
    ctx.addShape(slide, { left: x, top: 310, width: 1, height: 172, fill: C.line });
    ctx.addText(slide, { text: t, left: x - 20, top: 488, width: 44, height: 18, fontSize: 12, color: C.steel, align: "center" });
  });
  rows.forEach(([name, range, color], i) => {
    const y = 344 + i * 54;
    ctx.addText(slide, { text: name, left: 120, top: y - 4, width: 80, height: 22, fontSize: 16, bold: true, color: C.ink });
    ctx.addShape(slide, { left: 218 + range[0], top: y, width: range[1] - range[0], height: 22, fill: color });
  });
  ctx.addShape(slide, { left: 548, top: 330, width: 92, height: 154, fill: "#00000000", line: { style: "solid", fill: C.coral, width: 2 } });
  ctx.addText(slide, { text: "mutual slot", left: 540, top: 292, width: 110, height: 22, fontSize: 14, bold: true, color: C.coral, align: "center" });

  panel(slide, ctx, { left: 900, top: 230, width: 300, height: 236 }, { fill: C.charcoal, line: "#00000000" });
  ctx.addText(slide, {
    text: "Input format",
    left: 928,
    top: 258,
    width: 200,
    height: 26,
    fontSize: 22,
    bold: true,
    color: C.gold,
  });
  ctx.addText(slide, {
    text: "you: Thu 7:30 PM\nMina: Thu 7:30 PM\nEthan: Thu 7:30 PM",
    left: 928,
    top: 312,
    width: 236,
    height: 88,
    fontSize: 17,
    typeface: ctx.fonts.mono,
    color: "#EAF0E8",
  });
  body(slide, ctx, "The agent asks for free windows only: no event names, no private calendar details.", { left: 900, top: 500, width: 300, height: 78 }, { size: 18, bold: true, color: C.ink });

  footer(slide, ctx, 7, "Source: parseAvailabilityWindows() + findMutualSlots()");
  return slide;
}
