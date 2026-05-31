# DoneDanaDone — WhatsApp AI Booking Chatbot

A prototype WhatsApp chatbot for booking home services (Home Chef + House Help) in India. 

**Flow:** user messages on WhatsApp → AI parses intent → state machine guides through service → area → slot → contact details → Razorpay payment link → confirmation.

## Stack

- **Next.js 16** (app router) — webhook endpoints + admin dashboard
- **Supabase** — Postgres + realtime for `bookings`, `slots`, `service_areas`, `conversation_state`
- **Twilio** — WhatsApp Business API send/receive
- **Gemini 2.5 Flash** — intent NLU for free-text fallback
- **Razorpay** — payment links (UPI + cards) + webhook for paid confirmation

> n8n is the eventual orchestrator; this prototype wires the logic directly in Next.js API routes.

## Setup

### 1. Install + env

```bash
npm install
cp .env.example .env.local
# fill in Supabase, Twilio, Gemini, Razorpay keys
```

### 2. Database

Create a Supabase project, then in the SQL editor run [`supabase/schema.sql`](supabase/schema.sql). It creates the 4 tables, seeds 5 serviceable cities + 2 non-serviceable (to demo the rejection flow), and seeds realistic slots for today/tomorrow/weekend across both services.

### 3. Twilio sandbox

1. In the Twilio Console: Messaging → Try it out → WhatsApp. Note the sandbox number and the join code.
2. Join from your phone (`join <code>` to the sandbox number).
3. Expose localhost: `ngrok http 3000`.
4. In the sandbox config, set **WHEN A MESSAGE COMES IN** to `https://<ngrok>.ngrok.app/api/whatsapp` (HTTP POST).

### 4. Razorpay test mode

1. Dashboard → Settings → Webhooks → Add Webhook.
2. URL: `https://<ngrok>.ngrok.app/api/razorpay-webhook`.
3. Subscribe to event: `payment_link.paid`.
4. Set the webhook secret and copy it into `.env.local` → `RAZORPAY_WEBHOOK_SECRET`.

### 5. Run

```bash
npm run dev
```

- Demo landing: <http://localhost:3000>
- Admin dashboard: <http://localhost:3000/admin> (password from `ADMIN_PASSWORD`, default `admin123`)

## Conversation flow

```
WELCOME
  "1" / "Home Chef" / "I need a cook"  ─┐
  "2" / "House Help" / "maid"           ├─→ AREA_CHECK
                                        │
AREA_CHECK                              │
  serviceable area  → SLOT_DAY_SELECT   │
  non-serviceable   → rejection, reset  │
                                        │
SLOT_DAY_SELECT → SLOT_TIME_SELECT → COLLECT_NAME
  → COLLECT_ADDRESS → COLLECT_LANDMARK → COLLECT_NOTES
  → PAYMENT (creates booking + Razorpay link, sends WhatsApp)
                                        │
[Razorpay webhook] → CONFIRMED          ┘
  → marks booking paid, sends booking ID over WhatsApp
```

Free-text fallbacks ("I need a cook tomorrow in Noida") are normalized by Gemini 2.5 Flash, which extracts `service_type`, `time_preference`, and `area` to fast-forward the state machine.

Universal reset words anywhere: `menu`, `restart`, `reset`, `start`, `hi`, `hello`.

## File map

```
app/
  page.tsx                       Landing
  layout.tsx                     Root layout
  admin/                         Password-gated realtime bookings table
  booking/thanks/page.tsx        Razorpay callback landing
  api/
    whatsapp/route.ts            Twilio incoming WhatsApp webhook
    razorpay-webhook/route.ts    Razorpay payment_link.paid webhook
    admin/login/route.ts         Admin password check
lib/
  supabase.ts                    Server admin client + domain types
  twilio.ts                      WhatsApp send helper
  gemini.ts                      Intent parser (Gemini 2.5 Flash)
  razorpay.ts                    Payment link create + HMAC verify
  state-machine.ts               Conversation flow + booking creation
supabase/schema.sql              Tables + seed data
```

## Demo script for the pitch

1. From your phone, send `hi` to the Twilio sandbox.
2. Reply `1` (Home Chef).
3. Reply `Gurugram`.
4. Reply `2` (Tomorrow).
5. Pick a slot.
6. Name → Address → Landmark (`skip`) → Notes (`skip`).
7. Tap the Razorpay link, pay with the test card `4111 1111 1111 1111`.
8. Within a few seconds the WhatsApp confirmation message arrives and the booking turns green on `/admin`.

For the non-serviceable rejection: in step 3 type `Pune`.
For free-text NLU: instead of step 1+2, send `I need a cook tomorrow in Noida` — the bot fast-forwards to slot selection.

## Notes

- All Twilio + Razorpay calls are server-only; secrets never reach the client.
- The admin page uses the public anon key with realtime — fine for this demo. Production should add RLS + auth.
- The conversation state is persisted in Supabase, so multiple Next.js instances can serve the webhook safely.
