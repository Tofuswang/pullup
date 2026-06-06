import type { AgentContext, AgentRoute, HostCommand } from "./types";

const hostCommands = new Map<string, HostCommand>([
  ["/clear", "clear"],
  ["/reset", "reset"],
  ["/draft", "draft"],
  ["/approve", "approve"],
  ["/send", "send"],
  ["/status", "status"],
]);

export function routeAgentInput(context: AgentContext): AgentContext {
  const command = hostCommands.get(context.text);
  if (command) {
    return { ...context, command, route: "host_command" };
  }

  if (
    context.guest &&
    context.guest.rsvpStatus !== "opted_out" &&
    !context.text.startsWith("/")
  ) {
    return { ...context, route: "guest_rsvp" };
  }

  return { ...context, route: "host_intake" };
}

export function routeNameForCommonGround(responseFound: boolean): AgentRoute | undefined {
  return responseFound ? "commonground" : undefined;
}
