import { C, bg, body, codeBox, footer, kicker, panel, title } from "./common.mjs";

export async function slide10(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx, C.charcoal);
  kicker(slide, ctx, "DEMO SCRIPT", true);
  title(slide, ctx, "Run the live flow, then show the branch and PR.", { color: C.paper, width: 760 });

  codeBox(
    slide,
    ctx,
    [
      "START",
      "CONSENT",
      "https://www.linkedin.com/in/your-profile/",
      "[paste AI Passport]",
      "APPROVE",
      "[preferences]",
      "YES",
      "you: Thu 7:30 PM; Mina: Thu 7:30 PM",
      "CONFIRM ROOM",
      "METHODOLOGY",
    ],
    72,
    220,
    560,
    398,
  );

  panel(slide, ctx, { left: 700, top: 232, width: 430, height: 162 }, { fill: "#DDE8DB", line: "#00000000" });
  body(slide, ctx, "What judges should understand", { left: 730, top: 248, width: 300, height: 58 }, { size: 21, bold: true, color: C.sageDark });
  body(slide, ctx, "CommonGround is a recommender system for the first hour, not a one-shot compatibility score.", { left: 730, top: 318, width: 350, height: 60 }, { size: 16, color: C.ink });

  panel(slide, ctx, { left: 700, top: 408, width: 430, height: 154 }, { fill: "#F4E5D3", line: "#00000000" });
  body(slide, ctx, "Next build layer", { left: 730, top: 428, width: 280, height: 36 }, { size: 22, bold: true, color: "#955D35" });
  body(slide, ctx, "Native iOS app: EventKit write-only, MapKit venue picker, Contacts picker, App Intents, and web fallback.", { left: 730, top: 474, width: 350, height: 66 }, { size: 17, color: C.ink });

  ctx.addText(slide, {
    text: "PR #3 is the source of truth for the current demo branch.",
    left: 704,
    top: 592,
    width: 430,
    height: 44,
    fontSize: 18,
    bold: true,
    color: C.gold,
  });
  footer(slide, ctx, 10, "Final slide: live script + roadmap");
  return slide;
}
