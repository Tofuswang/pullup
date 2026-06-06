# CommonGround Spectrum Agent

This folder is the Photon Spectrum implementation path for the CommonGround iMessage-style onboarding demo.

The pasted `Agent + definePlatform("telegram")` example is not the API shape used in Photon Spectrum's current docs. This version uses:

- `Spectrum(...)`
- `app.messages`
- `space.send(...)`
- `space.responding(...)`
- `terminal` provider for local testing
- `imessage` provider when Photon project credentials are available

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment

Copy the example env file:

```bash
cp .env.example .env
```

For local terminal testing, you can leave all values blank.

For iMessage cloud mode, fill:

```bash
PROJECT_ID="your-photon-project-id"
PROJECT_SECRET="your-photon-project-secret"
```

This local project already has `.env` configured for the current demo. Do not paste `.env` into slides, GitHub, or public chat.

For LLM-generated profile previews, fill:

```bash
LLM_KEY="your-llm-api-key"
LLM_BASE_URL="https://your-api-gateway.com/v1"
LLM_MODEL="deepseek/deepseek-v3"
```

If `LLM_KEY` is blank, the agent uses a deterministic fallback preview so the demo still runs.

## 3. Run

```bash
npm run dev
```

Then test the flow:

```text
START
CONSENT
https://www.linkedin.com/in/fu-syuan-wang-7719111a9/
[paste AI Passport]
APPROVE PASSPORT
[paste preferences]
APPROVE
YES
```

## Product Boundary

- LinkedIn URL verifies true-person identity only.
- AI Passport + explicit preferences create the matching profile.
- User sees plain-language summaries, not JSON.
- RoomTAIRA recommends the room.
- Photon Spectrum delivers the conversation.
