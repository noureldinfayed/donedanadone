# DoneDanaDone — WhatsApp AI Booking System

DoneDanaDone is a WhatsApp-first AI booking system for home services in India. Customers book Home Chef or House Help services through WhatsApp, pay through Razorpay, and the admin dashboard tracks bookings, providers, payments, and manual reassignment in real time.

**Flow:** WhatsApp message → AI/state-machine booking flow → address onboarding → slot selection → Razorpay payment → provider confirmation → customer confirmation → admin realtime dashboard.

## Stack

- **Next.js 16** App Router — landing page, webhook endpoints, admin dashboard, and server-side admin APIs
- **Supabase** — Postgres, server-side service-role queries, and realtime booking updates
- **Meta WhatsApp Cloud API** — direct WhatsApp send/receive integration
- **Gemini 2.5 Flash** — free-text intent parsing and provider time-reason parsing
- **Razorpay** — payment links, UPI/card payments, webhook confirmation, and payment metadata

## Setup

### 1. Install and Configure Env

```bash
npm install
cp .env.example .env.local
```

Fill in Supabase, Meta WhatsApp Cloud API, Gemini, Razorpay, and admin credentials.

### 2. Database

Create a Supabase project, then run the SQL in [`supabase/schema.sql`](supabase/schema.sql). For an existing database, run the migration in [`supabase/migrations/20260531000000_customers_blacklist_provider_unavailability.sql`](supabase/migrations/20260531000000_customers_blacklist_provider_unavailability.sql).

Core tables:

- `service_areas`, `slots`, `providers`, `bookings`, `conversation_state`
- `customers` for returning-customer address reuse
- `blacklist_addresses` for blocked apartment/sector/city combinations
- `provider_unavailability` for provider declines and temporary unavailability

Bookings include a short readable `booking_display_id` in the format `DDD-YYYYMMDD-XXXX`.

### 3. WhatsApp Webhook

Expose the app URL and configure the Meta WhatsApp Cloud API webhook to call:

```text
https://<your-domain>/api/whatsapp
```

Incoming WhatsApp messages are routed through the state machine in [`lib/state-machine.ts`](lib/state-machine.ts). WhatsApp sends are performed server-side so credentials never reach the browser.

### 4. Razorpay Webhook

In Razorpay test or live mode:

1. Dashboard → Settings → Webhooks → Add Webhook.
2. URL: `https://<your-domain>/api/razorpay-webhook`.
3. Subscribe to `payment_link.paid`.
4. Add the webhook secret to `.env.local` as `RAZORPAY_WEBHOOK_SECRET`.

The webhook marks bookings paid, stores payment metadata, assigns an eligible provider, and starts the provider confirmation flow.

### 5. Run Locally

```bash
npm run dev
```

- Landing page: <http://localhost:3000>
- Admin dashboard: <http://localhost:3000/admin>
- Providers dashboard: <http://localhost:3000/admin/providers>

## Customer Conversation Flow

```text
WELCOME
  → AREA_CHECK
  → RETURNING_CUSTOMER_CHECK
  → ADDRESS_CITY
  → ADDRESS_SECTOR
  → ADDRESS_APARTMENT
  → BLACKLIST_CHECK
  → SLOT_DAY_SELECT
  → SLOT_TIME_SELECT
  → COLLECT_NAME
  → COLLECT_LANDMARK
  → COLLECT_NOTES
  → PAYMENT
```

Address onboarding:

- Returning customers can reuse saved addresses or choose `New Address`.
- New customers choose city, sector/locality, then type apartment/building and flat number.
- Blacklisted addresses are rejected before slot selection.
- Valid addresses are saved to the `customers` table.

Free-text messages like `I need a cook tomorrow in Noida` are normalized by Gemini 2.5 Flash to extract service, area, and time preference.

Universal customer reset words: `menu`, `restart`, `reset`, `start`, `hi`, `hello`, `hey`.

## Payment and Provider Confirmation

After payment:

1. Razorpay calls `/api/razorpay-webhook`.
2. The booking is marked `confirmed` with `payment_status = success`.
3. The matcher assigns an active provider for the same service and area who is available at the booking time.
4. The provider receives a WhatsApp confirmation request:

```text
New Booking! 🔔

Order #[booking_id]
Service: [service]
Date: [date] at [time]
Address: [address]
Customer: [name]

Reply:
1 - Confirm ✅
2 - Decline ❌
```

Provider replies:

- `1` / `confirm` → booking becomes `provider_confirmed`, customer receives final confirmation.
- `2` / `decline` → provider is asked if they are working today.
- If not working, all-day unavailability is recorded.
- If working, the decline reason is collected; time-based reasons are parsed and stored in `provider_unavailability`.
- If another provider is available, the booking is reassigned and the new provider is notified.
- If no provider is available, booking becomes `needs_manual_assignment` and the customer is told the provider will be confirmed shortly.

## Admin Dashboard

The admin dashboard at `/admin` includes:

- Realtime bookings table
- Columns: Order ID, Customer Name, Phone, Service, Address, Date, Time, Provider, Status, Payment
- Filters for exact Order ID, customer name, city, status, and date range
- Provider modal with profile, working days/hours, bookings, ratings summary, and active toggle
- Payment modal with amount, method, Razorpay payment ID, timestamp, and status
- Manual reassignment modal filtered by service type and area
- Status colors for `pending`, `confirmed`, `provider_confirmed`, `completed`, `cancelled`, and `needs_manual_assignment`

Admin mutations are handled by server-side routes using the Supabase service-role key:

- `/api/admin/bookings/reassign`
- `/api/admin/providers/active`
- `/api/admin/providers`
- `/api/admin/login`

The browser only receives the Supabase anon key for realtime booking subscriptions.

## File Map

```text
app/
  page.tsx                         Landing page
  admin/                           Bookings and providers dashboard
  booking/thanks/page.tsx          Razorpay callback landing
  api/
    whatsapp/route.ts              Incoming WhatsApp webhook
    razorpay-webhook/route.ts      Razorpay payment webhook
    admin/                         Admin login, provider, and reassignment APIs
lib/
  supabase.ts                      Server Supabase client and domain types
  state-machine.ts                 Customer and provider conversation flows
  match.ts                         Provider eligibility and assignment
  gemini.ts                        Intent and time parsing
  razorpay.ts                      Payment link and webhook signature helpers
  notify.ts                        Provider notification message builder
supabase/
  schema.sql                       Full schema and seed data
  migrations/                      Incremental SQL migrations
```

## Operational Notes

- Supabase service-role access is server-side only.
- Admin realtime stays active through the Supabase anon client.
- The marketing page is independent from booking/admin workflows.
- The conversation state is persisted in Supabase so multiple Next.js instances can serve webhooks safely.
