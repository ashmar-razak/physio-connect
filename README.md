# Physio Connect

A matchmaking app connecting sports physios with teams and clubs needing cover — think of it as a marketplace for pitchside physiotherapy and matchday cover, inspired by the last-minute-cover problem clubs and physios both face.

## Features

- **Two account types**: Physio and Club/Team, each with a tailored profile and registration flow.
- **Required HCPC/CSP registration**: every physio account must provide their registration body (HCPC or CSP) and registration number at sign-up — enforced server-side, not just in the UI.
- **Certifications**: physios log certifications (PHICIS, ATMMiF, RFU Pitchside, First Aid at Work, AED, DBS Enhanced/Basic, Other), each with issuing body and dates.
- **Trust tiers**: a physio's visible trust tier (Unverified → Standard → Bronze → Silver → Gold) is derived automatically from how many certifications they hold, and factors into search ranking — this is separate from the star rating.
- **Insurance verification**: physios record professional indemnity/public liability insurance and whether it explicitly covers pitchside/event first-aid work (a standard clinic policy often doesn't). The **Verified** insurance badge only appears once *both* an explicit "yes" *and* an uploaded certificate are on file — a self-reported checkbox alone is treated as Unconfirmed and flagged for follow-up, mirroring a real manual vetting process.
- **Document uploads**: physios upload proof of registration, insurance, and DBS (PDF/JPEG/PNG/HEIC) via `/physios/me/documents`. Files are stored with randomized names and are never exposed on public browse/search endpoints — only the physio themselves (via `/physios/me`) and a club actively reviewing that physio's application to one of their own posted requests (via `/requests/:id/applications`) can see the document list.
- **Admin verification workflow**: a staff-only `ADMIN` role (never self-registered — seeded/provisioned directly) reviews the verification queue, approves or rejects each uploaded document with a note, and flips a physio's `registrationVerified` flag. The insurance **Verified** badge specifically requires an *approved* insurance document, not merely an uploaded one.
- **Bidirectional star ratings**: after a booking is marked complete, both the club and the physio can rate each other (1–5 stars + comment). Average ratings show on both physio and club profiles.
- **Location-aware matching**: profiles are geocoded (via OpenStreetMap Nominatim) from a free-text location, and both physio and club search support filtering/sorting by distance and travel radius. Either side can also tap "Use My Current Location" (via `expo-location`, works on web through the browser's Geolocation API too) to search from wherever they actually are instead of their registered home address — falls back gracefully with a clear message if permission is denied.
- **Cover request lifecycle**: club posts a request → physios browse/apply → club accepts one application (auto-declining the rest) → booking is created → either party marks it complete → both rate each other.
- **In-app notifications**: a polling badge (every 20s) and alerts list cover new applications, accept/decline, new ratings, document review outcomes, and registration verification — tapping one marks it read and deep-links to the relevant screen. This is in-app only; real push notifications (lock-screen alerts via Expo push) would need a physical device/EAS setup to build and test, which wasn't available in this environment — the data model here (`Notification` per user, typed by event) is designed so that's a thin addition later, not a rebuild.

## Stack

- **Backend**: Node.js, Express, TypeScript, Prisma. SQLite for local dev (zero setup), schema kept Postgres-portable (enums are validated `String` fields via zod rather than native Prisma enums, since SQLite doesn't support them — swap the `datasource` provider and `DATABASE_URL` to move to Postgres).
- **Frontend**: React Native + Expo Router (TypeScript), runs on iOS, Android, and web from one codebase.

## Getting started

### Backend

```bash
cd backend
cp .env.example .env   # defaults to local SQLite, no changes needed
npm install
npx prisma migrate dev
npm run seed            # optional: sample physios, clubs, bookings, ratings
npm run dev              # http://localhost:4000
```

Sample seeded logins (password `password123` for all):
- `sarah.physio@example.com` — HCPC physio, Bronze tier
- `james.physio@example.com` — CSP physio, Silver tier
- `welfare@loughboroughfc.example.com` — club
- `admin@physioconnect.example.com` — staff verification account

### Frontend

```bash
cd frontend
npm install
npm run web      # or: npm run ios / npm run android
```

The app auto-detects the backend URL (`localhost` for web/iOS simulator, `10.0.2.2` for Android emulator, or your machine's LAN IP for a physical device on the same network). Override with `EXPO_PUBLIC_API_URL` if needed.

### Moving to Postgres

Install Postgres, then in `backend/.env`:

```
DATABASE_URL="postgresql://user:password@localhost:5432/physio_connect"
```

and change `datasource db { provider = "sqlite" ... }` to `provider = "postgresql"` in `backend/prisma/schema.prisma`, then re-run `npx prisma migrate dev`.

## Project structure

```
backend/
  prisma/schema.prisma   data model
  prisma/seed.ts         sample data
  src/routes/            auth, physios, clubs, requests, bookings, ratings
  src/utils/             trust tier calc, haversine distance, geocoding
frontend/
  app/                   expo-router screens (file-based routing)
  src/api/               typed API client + endpoint wrappers
  src/context/           auth context (token persisted via AsyncStorage)
  src/components/        shared UI (Button, TextField, Chip, StarRating, ...)
```
