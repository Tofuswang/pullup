# Local iOS Integration Plan

CommonGround should use iPhone-native surfaces without pretending the server can
silently read private device data.

## MVP Decision

Use iMessage as the conversational surface and iOS handoffs for local data:

- Calendar: user checks iPhone Calendar and sends free windows.
- Calendar write: the native `ios/PullupCalendar` package can request EventKit
  write-only access and create a confirmed Apple Calendar event on-device.
- Maps: agent sends Apple Maps links for venue search and directions.
- Location status: user shares live location in Messages or texts `ARRIVED`.
- Contacts: user shares a contact card, phone, or email only when inviting someone.

The Photon/Spectrum agent cannot directly read local iPhone Calendar, Contacts,
or live location. Native calendar writes happen inside the iOS app through
EventKit after explicit write-only Calendar permission.

## User Flow

```text
User replies YES
→ agent asks user to check iPhone Calendar
→ user sends free windows only
→ agent proposes 2-3 slots
→ user chooses 1 / 2 / 3
→ native iOS app creates the confirmed Calendar event with EventKit write-only access
→ agent sends Apple Maps venue link
→ attendees share ARRIVED / live location voluntarily
→ post-event vibe feedback
```

## Calendar

MVP:

```text
To use your iPhone Calendar locally, check your Calendar app and send me 2-4 windows that are actually free.

Example:
Thu 7:30 PM, Sat 3 PM, Sun 4:30 PM

I only need free windows, not event names or private details.
```

Implemented native write path:

- `ios/PullupCalendar/Sources/PullupCalendar/EventKitCalendarWriter.swift`
  requests write-only Calendar access on iOS 17+.
- It creates confirmed events in the default writable calendar.
- The app must include `NSCalendarsWriteOnlyAccessUsageDescription`.

Future native app:

- read free/busy on-device after a separate full-access upgrade
- send only availability summaries to backend

## Apple Maps

MVP:

- Use Apple Maps URL links.
- Venue search:

```text
https://maps.apple.com/?q=quiet%20cafe%20near%20Da%27an%20Taipei
```

- Walking directions:

```text
https://maps.apple.com/?daddr=quiet%20cafe%20near%20Da%27an%20Taipei&dirflg=w
```

Future native app:

- MapKit venue picker
- current location permission
- ETA and travel-time-aware venue ranking

## Location Status

MVP:

- Ask users to text `ON MY WAY`, `ARRIVED`, or `RUNNING LATE`.
- If they want, they can use Messages' built-in live location sharing.
- Do not require location sharing for safety.

Future native app:

- CoreLocation permission prompt
- optional arrival detection
- ETA-aware reminders
- venue safety radius

## Contacts

MVP:

- The agent asks users to share a contact card, phone, or email manually.
- The agent does not read iPhone Contacts.
- Contact exchange after the event remains mutual opt-in.

Future native app:

- Contacts permission prompt
- user-selected contact picker
- no bulk contact upload
- invite only selected contacts

## Judge-Friendly Explanation

> We dropped Google OAuth for the demo and moved to local iOS handoff. The
> iMessage agent asks users to share only free windows from their iPhone Calendar,
> the native iOS package can create confirmed events with EventKit write-only
> access, sends Apple Maps links for venue planning, supports voluntary location
> status, and only uses contacts the user explicitly shares. Full calendar
> reading, MapKit, CoreLocation, and Contacts remain explicit future permission
> upgrades.
