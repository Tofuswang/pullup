import { C, bg, body, footer, kicker, panel, title } from "./common.mjs";

export async function slide04(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  kicker(slide, ctx, "TRUST ARCHITECTURE");
  title(slide, ctx, "Matching starts only after consented, separated data layers.");

  const layers = [
    ["1", "Verification layer", "LinkedIn URL", "Used only as a true-person identity handle. No scraping and no matching facts."],
    ["2", "User-approved layer", "AI Passport", "Everyday-AI summary is reviewed, redacted, and approved before use."],
    ["3", "Explicit constraint layer", "Preferences", "Intent, boundaries, availability, budget, location radius, and alcohol comfort."],
    ["4", "Shared layer", "Context Card", "Other users see only lightweight common ground and safe prompts."],
  ];
  layers.forEach(([num, h, tag, s], i) => {
    const x = 72 + i * 292;
    panel(slide, ctx, { left: x, top: 238, width: 250, height: 288 }, { fill: i === 3 ? C.charcoal : C.white });
    ctx.addText(slide, {
      text: num,
      left: x + 18,
      top: 258,
      width: 48,
      height: 48,
      fontSize: 36,
      bold: true,
      color: i === 3 ? C.gold : C.coral,
      typeface: ctx.fonts.title,
    });
    ctx.addText(slide, { text: h, left: x + 20, top: 318, width: 208, height: 54, fontSize: 19, bold: true, color: i === 3 ? C.paper : C.ink });
    ctx.addText(slide, { text: tag, left: x + 20, top: 386, width: 206, height: 22, fontSize: 13, bold: true, color: i === 3 ? C.gold : C.sageDark });
    ctx.addText(slide, { text: s, left: x + 20, top: 424, width: 206, height: 82, fontSize: 15, color: i === 3 ? "#DDE8DB" : C.steel });
  });

  body(
    slide,
    ctx,
    "Pitch-safe boundary: the MVP does not scrape LinkedIn, ingest raw chat history, silently read iPhone data, or claim a trained compatibility model.",
    { left: 84, top: 574, width: 980, height: 62 },
    { size: 20, bold: true, color: C.ink },
  );
  footer(slide, ctx, 4, "Source: src/methodology_map.ts + docs/methodology-to-mvp-map.md");
  return slide;
}
