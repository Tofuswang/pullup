import { C, bg, body, footer, kicker, panel, scoreBar, title } from "./common.mjs";

export async function slide05(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  kicker(slide, ctx, "RECOMMENDER ENGINE");
  title(slide, ctx, "The model is framed as room quality, not destiny prediction.");

  panel(slide, ctx, { left: 68, top: 222, width: 612, height: 392 }, { fill: C.white });
  ctx.addText(slide, { text: "Current recommender output", left: 96, top: 248, width: 360, height: 28, fontSize: 22, bold: true, color: C.ink });
  scoreBar(slide, ctx, "First-meeting quality", 0.86, 96, 302, 190, C.coral);
  scoreBar(slide, ctx, "Dyadic chemistry", 0.74, 96, 356, 190, C.sage);
  scoreBar(slide, ctx, "Group dynamics", 0.82, 96, 410, 190, C.gold);
  scoreBar(slide, ctx, "Experience fit", 0.90, 96, 464, 190, "#8AA6B5");
  body(
    slide,
    ctx,
    "Scores are first-pass product heuristics from AI Passport + preferences. They are demo explainability, not validated empirical coefficients.",
    { left: 96, top: 536, width: 500, height: 58 },
    { size: 15, color: C.steel },
  );

  panel(slide, ctx, { left: 724, top: 222, width: 436, height: 392 }, { fill: C.charcoal, line: "#00000000" });
  ctx.addText(slide, { text: "Signal pipeline", left: 752, top: 248, width: 300, height: 28, fontSize: 22, bold: true, color: C.paper });
  const rows = [
    ["Passport parser", "interests, values, social modes, boundaries, energy"],
    ["Candidate pool", "seeded NTU-linked demo users"],
    ["Room scorer", "dyadic + group + activity mechanics"],
    ["Context generator", "safe shared context and warm-up prompts"],
  ];
  rows.forEach(([h, s], i) => {
    const y = 306 + i * 72;
    ctx.addShape(slide, { left: 752, top: y + 8, width: 16, height: 16, fill: i === 2 ? C.coral : C.gold });
    ctx.addText(slide, { text: h, left: 790, top: y, width: 220, height: 22, fontSize: 18, bold: true, color: C.paper });
    ctx.addText(slide, { text: s, left: 790, top: y + 28, width: 310, height: 28, fontSize: 13, color: "#CAD5CE" });
  });
  footer(slide, ctx, 5, "Source: src/commonground_recommender.ts");
  return slide;
}
