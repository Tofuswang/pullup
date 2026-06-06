export const C = {
  paper: "#F8F5EF",
  ink: "#16211F",
  charcoal: "#111817",
  sage: "#6E8B75",
  sageDark: "#3F5F4B",
  coral: "#D96C4F",
  steel: "#6C7A89",
  mist: "#E6EBE4",
  gold: "#C9A959",
  white: "#FFFFFF",
  line: "#CBD4C8",
};

export function bg(slide, ctx, fill = C.paper) {
  ctx.addShape(slide, { left: 0, top: 0, width: 1280, height: 720, fill });
}

export function footer(slide, ctx, n, note = "CommonGround demo deck | current GitHub implementation") {
  ctx.addText(slide, {
    text: note,
    left: 54,
    top: 682,
    width: 760,
    height: 20,
    fontSize: 10,
    color: C.steel,
  });
  ctx.addText(slide, {
    text: String(n).padStart(2, "0"),
    left: 1170,
    top: 676,
    width: 54,
    height: 28,
    fontSize: 15,
    bold: true,
    color: C.steel,
    align: "right",
  });
}

export function kicker(slide, ctx, text, dark = false) {
  ctx.addShape(slide, {
    left: 54,
    top: 46,
    width: 34,
    height: 3,
    fill: dark ? C.gold : C.coral,
  });
  ctx.addText(slide, {
    text,
    left: 98,
    top: 34,
    width: 520,
    height: 28,
    fontSize: 13,
    bold: true,
    color: dark ? C.gold : C.sageDark,
  });
}

export function title(slide, ctx, text, opts = {}) {
  ctx.addText(slide, {
    text,
    left: opts.left ?? 54,
    top: opts.top ?? 78,
    width: opts.width ?? 820,
    height: opts.height ?? 118,
    fontSize: opts.size ?? 39,
    bold: true,
    typeface: ctx.fonts.title,
    color: opts.color ?? C.ink,
    insets: { left: 0, right: 0, top: 0, bottom: 0 },
  });
}

export function body(slide, ctx, text, frame, opts = {}) {
  ctx.addText(slide, {
    text,
    ...frame,
    fontSize: opts.size ?? 19,
    color: opts.color ?? C.ink,
    bold: opts.bold ?? false,
    insets: opts.insets ?? { left: 0, right: 0, top: 0, bottom: 0 },
  });
}

export function chip(slide, ctx, text, x, y, w, opts = {}) {
  const fill = opts.fill ?? C.mist;
  ctx.addShape(slide, {
    left: x,
    top: y,
    width: w,
    height: 30,
    fill,
    line: ctx.line(opts.line ?? "#00000000", opts.lineWidth ?? 0),
  });
  ctx.addText(slide, {
    text,
    left: x + 10,
    top: y + 6,
    width: w - 20,
    height: 18,
    fontSize: 12,
    bold: true,
    color: opts.color ?? C.ink,
    align: "center",
  });
}

export function panel(slide, ctx, frame, opts = {}) {
  ctx.addShape(slide, {
    ...frame,
    fill: opts.fill ?? C.white,
    line: ctx.line(opts.line ?? C.line, opts.lineWidth ?? 1),
  });
}

export function statusPill(slide, ctx, status, x, y) {
  const styles = {
    implemented: { fill: "#DDE8DB", color: C.sageDark, text: "IMPLEMENTED" },
    simulated: { fill: "#F4E5D3", color: "#955D35", text: "MVP HEURISTIC" },
    future: { fill: "#E3E7EC", color: "#4E5B68", text: "PLANNED" },
  };
  const s = styles[status];
  chip(slide, ctx, s.text, x, y, 126, { fill: s.fill, color: s.color });
}

export function arrow(slide, ctx, x1, y1, x2, y2, color = C.line) {
  const horizontal = Math.abs(y2 - y1) < Math.abs(x2 - x1);
  if (horizontal) {
    ctx.addShape(slide, {
      left: Math.min(x1, x2),
      top: y1,
      width: Math.abs(x2 - x1),
      height: 2,
      fill: color,
    });
    ctx.addShape(slide, {
      left: x2 - 5,
      top: y2 - 4,
      width: 8,
      height: 8,
      fill: color,
      geometry: "triangle",
    });
  } else {
    ctx.addShape(slide, {
      left: x1,
      top: Math.min(y1, y2),
      width: 2,
      height: Math.abs(y2 - y1),
      fill: color,
    });
    ctx.addShape(slide, {
      left: x2 - 4,
      top: y2 - 3,
      width: 8,
      height: 8,
      fill: color,
      geometry: "triangle",
    });
  }
}

export function scoreBar(slide, ctx, label, value, x, y, w, accent = C.sage) {
  ctx.addText(slide, {
    text: label,
    left: x,
    top: y,
    width: 250,
    height: 22,
    fontSize: 15,
    bold: true,
    color: C.ink,
  });
  ctx.addShape(slide, { left: x + 255, top: y + 6, width: w, height: 10, fill: "#DCE2D9" });
  ctx.addShape(slide, { left: x + 255, top: y + 6, width: w * value, height: 10, fill: accent });
  ctx.addText(slide, {
    text: `${Math.round(value * 100)} / 100`,
    left: x + 255 + w + 14,
    top: y - 1,
    width: 88,
    height: 22,
    fontSize: 14,
    bold: true,
    color: C.steel,
  });
}

export function codeBox(slide, ctx, lines, x, y, w, h) {
  panel(slide, ctx, { left: x, top: y, width: w, height: h }, { fill: C.charcoal, line: "#00000000" });
  ctx.addText(slide, {
    text: lines.join("\n"),
    left: x + 22,
    top: y + 20,
    width: w - 44,
    height: h - 40,
    fontSize: 16,
    typeface: ctx.fonts.mono,
    color: "#EAF0E8",
    insets: { left: 0, right: 0, top: 0, bottom: 0 },
  });
}
