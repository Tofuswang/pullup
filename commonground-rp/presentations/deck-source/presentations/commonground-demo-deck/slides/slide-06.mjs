import { C, bg, body, chip, footer, kicker, panel, title } from "./common.mjs";

export async function slide06(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  kicker(slide, ctx, "CONTEXT CARD");
  title(slide, ctx, "Private input becomes a lightweight, safe pre-event brief.");

  panel(slide, ctx, { left: 80, top: 204, width: 585, height: 430 }, { fill: C.white });
  chip(slide, ctx, "WEEKLY ROOM DROP", 112, 228, 180, { fill: "#F4E5D3", color: "#955D35" });
  ctx.addText(slide, { text: "AI x Career Transition Coffee Room", left: 112, top: 278, width: 470, height: 64, fontSize: 27, bold: true, typeface: ctx.fonts.title, color: C.ink });
  ctx.addText(slide, { text: "You + Mina + Ethan + Claire", left: 112, top: 354, width: 360, height: 24, fontSize: 18, bold: true, color: C.sageDark });
  ctx.addText(slide, {
    text: "Activity: coffee / matcha with structured conversation cards\nVenue style: quiet cafe near Da'an Taipei",
    left: 112,
    top: 394,
    width: 465,
    height: 54,
    fontSize: 17,
    color: C.ink,
  });
  ctx.addShape(slide, { left: 112, top: 462, width: 475, height: 1, fill: C.line });
  ctx.addText(slide, { text: "Shared context", left: 112, top: 482, width: 200, height: 22, fontSize: 17, bold: true, color: C.ink });
  ctx.addText(slide, {
    text: "• AI changing work\n• career transitions across tech, finance, and product\n• low-pressure city cafe culture",
    left: 112,
    top: 512,
    width: 470,
    height: 78,
    fontSize: 16,
    color: C.steel,
  });

  panel(slide, ctx, { left: 728, top: 224, width: 390, height: 118 }, { fill: "#DDE8DB", line: "#00000000" });
  body(slide, ctx, "Shown to participants", { left: 754, top: 244, width: 250, height: 24 }, { size: 18, bold: true, color: C.sageDark });
  body(slide, ctx, "shared context, warm-up prompts, public venue, no forced contact exchange", { left: 754, top: 278, width: 318, height: 42 }, { size: 15, color: C.ink });

  panel(slide, ctx, { left: 728, top: 362, width: 390, height: 118 }, { fill: "#F4E5D3", line: "#00000000" });
  body(slide, ctx, "Hidden from participants", { left: 754, top: 382, width: 260, height: 24 }, { size: 18, bold: true, color: "#955D35" });
  body(slide, ctx, "raw AI Passport, private boundaries, LinkedIn URL, exact preference text", { left: 754, top: 416, width: 318, height: 42 }, { size: 15, color: C.ink });

  panel(slide, ctx, { left: 728, top: 500, width: 390, height: 118 }, { fill: C.charcoal, line: "#00000000" });
  body(slide, ctx, "Product principle", { left: 754, top: 520, width: 250, height: 24 }, { size: 18, bold: true, color: C.gold });
  body(slide, ctx, "make the meeting less awkward without exposing the person", { left: 754, top: 554, width: 318, height: 42 }, { size: 15, color: "#DDE8DB" });

  footer(slide, ctx, 6, "Source: contextCard() in src/commonground.ts");
  return slide;
}
