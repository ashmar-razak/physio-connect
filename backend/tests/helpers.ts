import request from "supertest";
import { createApp } from "../src/app";
import { prisma } from "../src/db";

export const app = createApp();

let emailCounter = 0;
function uniqueEmail(prefix: string): string {
  emailCounter += 1;
  return `${prefix}${emailCounter}@example.com`;
}

interface RegisterPhysioOverrides {
  email?: string;
  password?: string;
  fullName?: string;
  locationText?: string;
  registrationBody?: "HCPC" | "CSP";
  registrationNumber?: string;
  sports?: string[];
  [key: string]: unknown;
}

export async function registerPhysio(overrides: RegisterPhysioOverrides = {}) {
  const body = {
    role: "PHYSIO",
    email: overrides.email ?? uniqueEmail("physio"),
    password: overrides.password ?? "password123",
    fullName: overrides.fullName ?? "Test Physio",
    locationText: overrides.locationText ?? "Manchester, UK",
    registrationBody: overrides.registrationBody ?? "HCPC",
    registrationNumber: overrides.registrationNumber ?? "PH000000",
    sports: overrides.sports ?? ["football"],
    ...overrides,
  };

  const res = await request(app).post("/auth/register").send(body);
  if (res.status !== 201) {
    throw new Error(`registerPhysio failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { token: res.body.token as string, user: res.body.user, password: body.password };
}

interface RegisterClubOverrides {
  email?: string;
  password?: string;
  clubName?: string;
  sport?: string;
  contactName?: string;
  locationText?: string;
  [key: string]: unknown;
}

export async function registerClub(overrides: RegisterClubOverrides = {}) {
  const body = {
    role: "CLUB",
    email: overrides.email ?? uniqueEmail("club"),
    password: overrides.password ?? "password123",
    clubName: overrides.clubName ?? "Test FC",
    sport: overrides.sport ?? "football",
    contactName: overrides.contactName ?? "Test Manager",
    locationText: overrides.locationText ?? "Leeds, UK",
    ...overrides,
  };

  const res = await request(app).post("/auth/register").send(body);
  if (res.status !== 201) {
    throw new Error(`registerClub failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { token: res.body.token as string, user: res.body.user, password: body.password };
}

// Provisions an ADMIN account directly (mirrors seed.ts — admins are never
// self-registered through the public API).
export async function createAdmin(email = uniqueEmail("admin")) {
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash("password123", 10);
  const user = await prisma.user.create({ data: { email, passwordHash, role: "ADMIN" } });

  const res = await request(app).post("/auth/login").send({ email, password: "password123" });
  if (res.status !== 200) {
    throw new Error(`admin login failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { token: res.body.token as string, user: res.body.user, userId: user.id };
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function createOpenRequest(clubToken: string, overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post("/requests")
    .set(authHeader(clubToken))
    .send({
      dateNeeded: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      startTime: "09:00",
      endTime: "13:00",
      venueName: "Test Ground",
      venuePostcode: "LE11 3AB",
      sport: "football",
      ageGroup: "Senior",
      coverType: "MATCHDAY",
      urgency: "WITHIN_2_WEEKS",
      ...overrides,
    });
  if (res.status !== 201) {
    throw new Error(`createOpenRequest failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.request;
}

// Full happy-path: club posts a request, physio applies, club accepts it.
// Returns everything a test might want to poke at afterward.
export async function createAcceptedBooking(clubToken: string, physioToken: string) {
  const coverRequest = await createOpenRequest(clubToken);
  const application = await request(app).post(`/requests/${coverRequest.id}/apply`).set(authHeader(physioToken));
  const accept = await request(app)
    .post(`/requests/applications/${application.body.application.id}/accept`)
    .set(authHeader(clubToken));
  if (accept.status !== 201) {
    throw new Error(`createAcceptedBooking failed: ${accept.status} ${JSON.stringify(accept.body)}`);
  }
  return { coverRequest, application: application.body.application, booking: accept.body.booking };
}
