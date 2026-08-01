# ussd-prod

USSD gateway (Africa's Talking compatible) for browsing underwriters/products
and requesting a policy purchase. Architecture mirrors cush's USSD module
(`UssdController` / `UssdService` / `UssdFlowService`), but standalone:
in-memory sessions, mock underwriter/product data, no external DB.

## Quick start

```bash
npm install
npm run dev
```

## Try it (simulates an Africa's Talking callback)

```bash
# 1. Dial in — empty text = first screen
curl -s http://localhost:4000/ussd -d "sessionId=abc123&phoneNumber=254712345678&text="

# 2. Choose "Browse underwriters"
curl -s http://localhost:4000/ussd -d "sessionId=abc123&phoneNumber=254712345678&text=1"

# 3. Pick an underwriter (e.g. 1 = Britam)
curl -s http://localhost:4000/ussd -d "sessionId=abc123&phoneNumber=254712345678&text=1*1"

# 4. Pick a product
curl -s http://localhost:4000/ussd -d "sessionId=abc123&phoneNumber=254712345678&text=1*1*1"

# 5. Buy now
curl -s http://localhost:4000/ussd -d "sessionId=abc123&phoneNumber=254712345678&text=1*1*1*1"

# 6. Enter payment phone
curl -s http://localhost:4000/ussd -d "sessionId=abc123&phoneNumber=254712345678&text=1*1*1*1*0712345678"

# 7. Confirm
curl -s http://localhost:4000/ussd -d "sessionId=abc123&phoneNumber=254712345678&text=1*1*1*1*0712345678*1"
```

Each response is plain text prefixed `CON` (session continues) or `END`
(session terminates) — same convention Africa's Talking expects.

## What's mocked / what to wire up for real

- **Underwriters & products** (`src/data/underwriters.ts`) — static array.
  Replace with a call to cush's `GET /api/underwriters` (see cush's
  `Underwriter` model) or a shared DB.
- **Sessions** (`src/services/SessionStore.ts`) — in-memory `Map`, 5 min TTL,
  lost on restart. Replace with a DB-backed store (mirroring cush's
  `UssdSession` model/migration) once this needs to survive restarts or run
  behind multiple instances.
- **Purchase** (`UssdFlowService.finalizePurchase`) — just logs and returns a
  mock reference. Real flow needs an M-Pesa STK push + payment callback (see
  cush's `PaymentController`/`CoverService`) and policy issuance.
# production-ussd
