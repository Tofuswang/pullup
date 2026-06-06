import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type RuntimeDocsContext = {
  runtimeRules: string;
  commongroundRules: string;
  iosHandoffRules: string;
  warnings: string[];
  loadedFiles: string[];
};

type RuntimeDocsOptions = {
  rootDir?: string;
  env?: NodeJS.ProcessEnv;
};

export const runtimeDocsWhitelist = [
  "docs/agent-architecture.md",
  "docs/commonground-business-flow-v2.md",
  "docs/ios-local-integrations.md",
] as const;

let cachedPrompt: string | undefined;
let docsOverride: RuntimeDocsContext | undefined;

export function setRuntimeDocsContextForTesting(
  context: RuntimeDocsContext | undefined,
): void {
  docsOverride = context;
  cachedPrompt = undefined;
}

export function resetRuntimeDocsCacheForTesting(): void {
  cachedPrompt = undefined;
}

export function runtimeDocsPrompt(options: RuntimeDocsOptions = {}): string {
  const env = options.env ?? process.env;
  if (env.PULLUP_DOCS_CONTEXT === "0") return "";
  if (docsOverride) return formatRuntimeDocsContext(docsOverride, docsMaxChars(env));
  if (cachedPrompt !== undefined) return cachedPrompt;

  const context = loadRuntimeDocsContext(options.rootDir ?? process.cwd());
  cachedPrompt = formatRuntimeDocsContext(context, docsMaxChars(env));
  return cachedPrompt;
}

export function loadRuntimeDocsContext(rootDir = process.cwd()): RuntimeDocsContext {
  const warnings: string[] = [];
  const loadedFiles: string[] = [];
  const readWhitelisted = (relativePath: typeof runtimeDocsWhitelist[number]) => {
    const path = join(rootDir, relativePath);
    if (!existsSync(path)) {
      warnings.push(`Missing runtime docs file: ${relativePath}`);
      return "";
    }

    loadedFiles.push(relativePath);
    return readFileSync(path, "utf8");
  };

  const architecture = readWhitelisted("docs/agent-architecture.md");
  const commonground = readWhitelisted("docs/commonground-business-flow-v2.md");
  const ios = readWhitelisted("docs/ios-local-integrations.md");

  return {
    runtimeRules: joinSections(architecture, [
      "Design Principle",
      "The Agent Team",
      "Recommended MVP Agent Set",
      "Workflow",
      "What Each Agent Must Not Do",
    ]),
    commongroundRules: joinSections(commonground, [
      "CommonGround Member Flow",
      "Scheduling",
      "Event Confirmation",
      "Shared Infrastructure",
      "What Is Built Now",
      "V2 Positioning",
    ]),
    iosHandoffRules: joinSections(ios, [
      "MVP Decision",
      "User Flow",
      "Calendar",
      "Apple Maps",
      "Location Status",
      "Contacts",
      "Judge-Friendly Explanation",
    ]),
    warnings,
    loadedFiles,
  };
}

export function formatRuntimeDocsContext(
  context: RuntimeDocsContext,
  maxChars = 6000,
): string {
  const sections = [
    ["Runtime rules", context.runtimeRules],
    ["CommonGround rules", context.commongroundRules],
    ["iOS handoff rules", context.iosHandoffRules],
  ] as const;
  const body = sections
    .map(([heading, content]) => [`## ${heading}`, content.trim()].join("\n"))
    .filter((section) => !section.endsWith("\n"))
    .join("\n\n");
  const loaded = context.loadedFiles.length
    ? `Loaded docs: ${context.loadedFiles.join(", ")}`
    : "Loaded docs: none";
  const warnings = context.warnings.length
    ? `Warnings: ${context.warnings.join("; ")}`
    : "";
  const prompt = [
    "# Runtime Product Rules",
    loaded,
    warnings,
    "These rules guide product behavior. Event facts still come from durable memory and policy code controls approvals, sending, and opt-out.",
    "",
    body,
  ].filter(Boolean).join("\n");

  return truncate(prompt, maxChars);
}

function joinSections(markdown: string, headings: string[]): string {
  return headings
    .map((heading) => extractSection(markdown, heading))
    .filter(Boolean)
    .join("\n\n");
}

function extractSection(markdown: string, heading: string): string {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => {
    const normalized = line.replace(/^#+\s*/, "").trim();
    return normalized === heading;
  });
  if (start === -1) return "";

  const startLevel = headingLevel(lines[start]!);
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    const level = headingLevel(lines[index]!);
    if (level > 0 && level <= startLevel) {
      end = index;
      break;
    }
  }

  return lines.slice(start, end).join("\n").trim();
}

function headingLevel(line: string): number {
  const match = line.match(/^(#+)\s+/);
  return match?.[1]?.length ?? 0;
}

function docsMaxChars(env: NodeJS.ProcessEnv): number {
  const maxChars = Number.parseInt(env.PULLUP_DOCS_MAX_CHARS ?? "6000", 10);
  return Number.isFinite(maxChars) && maxChars > 0 ? maxChars : 6000;
}

function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const suffix = "\n[docs context truncated]";
  if (maxChars <= suffix.length) return suffix.slice(0, maxChars);
  return `${text.slice(0, maxChars - suffix.length).trimEnd()}${suffix}`;
}
