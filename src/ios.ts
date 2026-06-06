export function appleMapsSearchUrl(query: string): string {
  const url = new URL("https://maps.apple.com/");
  url.searchParams.set("q", query);
  return url.toString();
}

export function appleMapsDirectionsUrl(query: string): string {
  const url = new URL("https://maps.apple.com/");
  url.searchParams.set("daddr", query);
  url.searchParams.set("dirflg", "w");
  return url.toString();
}

export function iosLocalHandoffInstructions(): string {
  return [
    "For the iPhone-native parts:",
    "",
    `Venue Apple Maps: ${appleMapsSearchUrl("quiet cafe near Da'an Taipei")}`,
    "Location: use Messages to share your current/live location when you want me to coordinate around where you are. You do not need to type a neighborhood.",
    "Arrival status: when you’re there, text ARRIVED.",
    "Contacts: only share a contact card or phone/email if you want me to invite someone. I won’t read your iPhone Contacts.",
  ].join("\n");
}

export function formatIphoneCalendarEventCard(input: {
  title: string;
  start: Date;
  end: Date;
  location: string;
  notes: string;
}): string {
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const endFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return [
    "Calendar event ready:",
    "",
    input.title,
    `${dateFormatter.format(input.start)} - ${endFormatter.format(input.end)}`,
    `Location: ${input.location}`,
    "",
    input.notes,
    "",
    "On iPhone, tap the date/time in this message to add it to Calendar.",
  ].join("\n");
}
