# CommonGround Business Flow

## 1. Product Definition

CommonGround is a private, invitation-based offline social concierge for high-trust communities. It does not ask users to swipe, browse profiles, or keep chatting in an app. It delivers one curated room worth showing up for: the people, the activity, the venue, and the context.

The product is experienced through iMessage, powered by Photon Spectrum. CommonGround / RoomTAIRA decides the room; Photon delivers the conversation.

Core line:

> We do not recommend people. We recommend a room.

## 2. Marketplace Actors

### Users

Early users are NTU-origin students, alumni, or invited young professionals who want thoughtful offline social/dating experiences without swipe fatigue or awkward first meetings.

Users provide:

- consent
- true-person verification
- AI Passport
- explicit preferences
- availability
- post-event vibe feedback

Users receive:

- private onboarding
- limited matching profile preview
- weekly curated room recommendation
- Context Card
- mutual-confirm flow
- reminders
- post-event vibe tuning

### CommonGround Ops

Ops protects trust and quality in the early market.

Ops handles:

- invite approval
- safety review
- early match review
- venue/activity inventory
- cancellation/no-show handling
- feedback review
- community quality monitoring

### Venues / Activity Partners

Venues are not the first demo focus, but they become the monetization and supply layer later.

Venues provide:

- public-first spaces
- small-group capacity
- time slots
- price per head
- activity affordance
- safety/comfort fit

Venues receive:

- predictable small-group demand
- higher-intent bookings
- anonymized demand signals

## 3. User Acquisition Flow

### Step 1: Private Invitation

User receives an invite link or phone number.

Opening should feel prestigious, not administrative:

> You are one of a small first circle invited to CommonGround: a private NTU-origin room network for meeting thoughtful people offline. We do not do swiping. We design a room worth showing up for.

User replies:

```text
START
```

### Step 2: Consent

CommonGround explains the data boundary before collecting anything.

User consents to:

- LinkedIn URL for true-person verification only
- AI Passport for matching only after approval
- explicit preferences for logistics and boundaries

User does not consent to:

- LinkedIn scraping
- raw AI chat ingestion
- exposing raw Passport text to other members
- selling identifiable user data

### Step 3: True-Person Verification

User pastes LinkedIn URL.

Business purpose:

- reduce fake profiles
- create trust anchor
- support invite-only prestige

Important boundary:

> LinkedIn proves you are real. It does not define your personality or matching profile.

### Step 4: AI Passport Creation

User asks their everyday AI to summarize:

- social energy
- conversation style
- interests
- good first-meet settings
- awkwardness triggers
- boundaries

Business purpose:

- richer user signal than dating app forms
- user-permissioned data
- fast onboarding without creepy passive tracking

### Step 5: Redaction + Approval

User reviews the AI Passport and removes anything sensitive.

CommonGround converts only approved content into matching signals.

User sees plain language, not JSON.

### Step 6: Explicit Preferences

User provides what should never be inferred:

- dating/social intent
- availability
- budget
- neighborhood radius
- alcohol comfort
- preferred group size
- contact-exchange boundary

## 4. Weekly Drop Flow

CommonGround should operate around a weekly ritual, inspired by Ditto-style coordination.

### Weekly Timeline

```text
Sunday-Monday: collect availability and preference updates
Tuesday night: lock eligible user pool
Wednesday daytime: generate candidate rooms
Wednesday afternoon: human review / safety review
Wednesday evening: send weekly room drop
Thursday-Friday: mutual confirm and schedule
Weekend: offline rooms happen
After event: vibe feedback collected
Next week: model and ops learn from feedback
```

### User-Facing Promise

> Every week, CommonGround sends one room if there is a strong enough fit.

Do not promise unlimited matches. Scarcity is part of quality.

## 5. Matching / Room Formation Business Flow

### Stage 1: Eligibility Gate

Hard filters before recommendation:

- verified identity
- accepted invite/community eligibility
- safety flags clear
- intent compatibility
- boundary compatibility
- location feasibility
- availability overlap

Safety and consent are not weighted preferences. They are gates.

### Stage 2: Candidate Retrieval

RoomTAIRA retrieves plausible users using approved AI Passport signals and explicit constraints.

Signals include:

- taste clusters
- conversation topics
- social energy
- first-meet settings
- avoidance triggers
- logistics

### Stage 3: Room Formation

RoomTAIRA forms 3-5 person rooms.

The unit of matching is not a person. The unit is:

```text
people + activity + venue + context
```

Room quality depends on:

- conversation density
- reciprocal opt-in likelihood
- minimum member comfort
- logistics fit
- activity affordance
- safety and boundary fit

### Stage 4: Activity / Venue Recommendation

The system chooses an activity based on interaction mechanics, not only interest tags.

Examples:

- coffee / matcha: calm, low-pressure, easy first room
- gallery walk: shared object, movement, less interview-like
- city walk: casual, flexible, good for ambiverts
- mini workshop: structured, hands-on, lower awkwardness
- dinner: higher intimacy, use later or with stronger intent

### Stage 5: Human Review

Early-stage CommonGround should not be fully automatic.

Human review checks:

- safety risk
- awkwardness risk
- privacy leakage
- venue suitability
- group imbalance
- bad first-room optics

### Stage 6: Context Card

Participants receive a limited Context Card:

- why this room makes sense
- shared context
- activity reason
- warm-up prompts
- boundaries
- mutual contact-exchange rule

It must not show:

- LinkedIn URL
- raw AI Passport
- dating intent
- contact info
- internal scores
- private safety notes

## 6. Mutual Confirmation Flow

After receiving the Context Card, each user replies:

```text
YES
MAYBE
SKIP
```

Business rules:

- group happens only if enough people opt in
- no one is exposed as rejected
- maybe can be used for schedule flexibility
- skip tunes future recommendations
- repeated no-response lowers reliability

If enough people say yes, CommonGround schedules the room.

## 7. Scheduling + Event Logistics

CommonGround coordinates:

- final time
- public venue
- room title
- reminder
- cancellation path
- no-show policy
- post-event feedback

Photon Spectrum can support:

- iMessage delivery
- typing indicators
- polls
- replies
- group creation
- group renaming
- message history
- audit logs
- human-in-the-loop controls

Operational goal:

> Deliver a real-world event, not a conversation with a chatbot.

## 8. Post-Event Feedback Flow

Feedback is framed as vibe tuning, not person rating.

Ask:

- Did this group feel like your kind of people?
- Did the conversation feel natural?
- Was the activity a good container?
- Was the energy too quiet, balanced, or too intense?
- Would you enjoy a similar room again?
- What should we tune next time: people, activity, venue, timing, or group size?

Separate safety question:

> Anything we should privately review for safety or respect reasons?

Feedback updates:

- user taste graph
- activity fit
- venue quality
- group-size preference
- reliability score
- future room recommendations

## 9. Trust + Safety Business Rules

CommonGround is a trust network, not an open marketplace.

Trust mechanisms:

- invite-only access
- true-person verification
- public-first venues
- explicit boundaries
- mutual opt-in
- no forced contact exchange
- no-show penalty
- report/review path
- human review for safety incidents

Member quality should be earned and maintained.

## 10. Revenue Flow

### Phase 1: Free / Invite-Only Beta

Goal:

- prove willingness to onboard
- prove weekly drop engagement
- prove users accept rooms
- prove users actually show up

Metrics:

- invite-to-onboard conversion
- Passport completion rate
- weekly room opt-in rate
- scheduled-room rate
- attendance rate
- post-event feedback rate
- repeat opt-in rate

### Phase 2: Membership

Potential pricing:

- monthly membership for access to weekly drops
- premium access for higher-frequency rooms
- referral-based priority

Membership makes sense because trust products should not monetize by selling identifiable data.

### Phase 3: Experience Fee

Users pay per confirmed room:

- activity fee
- venue deposit
- booking fee
- concierge fee

This aligns revenue with successful offline coordination.

### Phase 4: Venue / Partner Revenue

Venues pay for:

- curated small-group bookings
- off-peak demand
- activity packages
- private/semi-private tables

Venue data boundary:

- allowed: anonymized demand, group size, budget range, time slot, activity type
- not allowed: names, contact info, dating intent, raw profiles, AI Passport, private feedback

## 11. Operating Dashboard Needed

Ops needs a simple dashboard before scale.

Views:

- onboarded users
- pending verification
- weekly eligible pool
- candidate rooms
- human review queue
- scheduled rooms
- cancellations/no-shows
- safety reports
- venue inventory
- feedback summaries

Early ops is not a weakness. It is how the product protects quality before automation.

## 12. Key Metrics

### Acquisition

- invite sent
- START rate
- consent rate
- verification completion
- AI Passport completion

### Matching

- eligible weekly users
- rooms generated
- rooms approved by human review
- Context Card sent
- yes / maybe / skip rate

### Event

- mutual-confirm rate
- schedule success rate
- attendance rate
- cancellation rate
- no-show rate

### Quality

- conversation felt natural
- would do similar room again
- activity fit
- venue fit
- safety incidents
- repeat weekly participation

### Business

- paid conversion
- revenue per room
- venue contribution margin
- retention by cohort
- referral rate

## 13. MVP Scope

Build now:

- Photon iMessage onboarding
- consent and verification flow
- AI Passport paste/redaction
- plain-language profile preview
- weekly drop state machine
- RoomTAIRA room recommendation
- Context Card
- YES / MAYBE / SKIP mutual confirm
- post-event vibe feedback
- manual ops review

Do not build yet:

- full mobile app
- swipe interface
- public profile feed
- fully automated safety decisions
- B-side venue dashboard
- complex payments
- real LinkedIn scraping

## 14. Business Flow Summary

```text
Invite
→ Consent
→ Verify real person
→ Import AI Passport
→ Redact and approve
→ Add explicit preferences
→ Enter weekly eligible pool
→ RoomTAIRA generates candidate rooms
→ Human review approves
→ Weekly room drop sent by iMessage
→ Users mutually confirm
→ CommonGround schedules public offline room
→ Event happens
→ Vibe feedback collected
→ Matching improves
→ Trust network compounds
```

The business is not a chatbot. It is a managed trust marketplace for offline social coordination.
