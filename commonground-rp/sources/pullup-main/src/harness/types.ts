import type {
  AgentInput,
  AgentResponse,
  AgentTraceStep,
  Guest,
  MessageLog,
  PullupEvent,
} from "../domain";

export type AgentRoute =
  | "commonground"
  | "guest_rsvp"
  | "host_command"
  | "host_intake";

export type HostCommand =
  | "clear"
  | "reset"
  | "draft"
  | "approve"
  | "send"
  | "status";

export type AgentMemory = {
  eventBrief: string;
  guestSummary: string;
  recentMessages: string;
  docsContext?: string;
};

export type ReplyIntent =
  | "host_intake"
  | "clear"
  | "draft"
  | "approve"
  | "send"
  | "status"
  | "reset"
  | "guest_rsvp"
  | "error";

export type ReplyContext = {
  event?: PullupEvent;
  guest?: Guest;
  memory?: AgentMemory;
  userText: string;
  fallback: string;
  intent: ReplyIntent;
  trace: AgentTraceStep[];
};

export type AgentContext = {
  input: AgentInput;
  text: string;
  phone?: string;
  route: AgentRoute;
  command?: HostCommand;
  event?: PullupEvent;
  guest?: Guest;
  guests: Guest[];
  recentMessages: MessageLog[];
  memory?: AgentMemory;
};

export type AgentPolicyResult = {
  allow: boolean;
  fallback?: string;
  trace?: AgentTraceStep;
};

export type { AgentInput, AgentResponse };
