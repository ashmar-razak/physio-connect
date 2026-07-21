import request from "supertest";
import { app, authHeader, registerClub, registerPhysio } from "../helpers";

describe("POST /auth/register", () => {
  it("rejects a physio registration missing registrationBody", async () => {
    const res = await request(app).post("/auth/register").send({
      role: "PHYSIO",
      email: "nobadge@example.com",
      password: "password123",
      fullName: "No Badge",
      locationText: "Derby, UK",
      registrationNumber: "PH000111",
      sports: ["football"],
    });

    expect(res.status).toBe(400);
    expect(res.body.details.fieldErrors.registrationBody).toBeDefined();
  });

  it("rejects a registrationBody that isn't HCPC or CSP", async () => {
    const res = await request(app).post("/auth/register").send({
      role: "PHYSIO",
      email: "badbody@example.com",
      password: "password123",
      fullName: "Bad Body",
      locationText: "Derby, UK",
      registrationBody: "BASRAT",
      registrationNumber: "PH000111",
      sports: ["football"],
    });

    expect(res.status).toBe(400);
  });

  it("registers a physio with HCPC registration and returns a working token", async () => {
    const { token, user } = await registerPhysio({ registrationBody: "HCPC", registrationNumber: "PH123456" });

    expect(user.role).toBe("PHYSIO");
    expect(user.physioProfile.registrationBody).toBe("HCPC");
    expect(user.physioProfile.registrationNumber).toBe("PH123456");
    expect(user.physioProfile.registrationVerified).toBe(false);
    expect(user.physioProfile.trustTier).toBe("UNVERIFIED");
    expect(token).toEqual(expect.any(String));
  });

  it("registers a club", async () => {
    const { user } = await registerClub({ clubName: "Loughborough Town FC" });
    expect(user.role).toBe("CLUB");
    expect(user.clubProfile.clubName).toBe("Loughborough Town FC");
  });

  it("rejects a duplicate email", async () => {
    const { user } = await registerPhysio();
    const res = await request(app).post("/auth/register").send({
      role: "PHYSIO",
      email: user.email,
      password: "password123",
      fullName: "Someone Else",
      locationText: "Derby, UK",
      registrationBody: "HCPC",
      registrationNumber: "PH999999",
      sports: ["football"],
    });
    expect(res.status).toBe(409);
  });
});

describe("POST /auth/login", () => {
  it("logs in with the correct password", async () => {
    const { user, password } = await registerPhysio();
    const res = await request(app).post("/auth/login").send({ email: user.email, password });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  it("rejects the wrong password", async () => {
    const { user } = await registerPhysio();
    const res = await request(app).post("/auth/login").send({ email: user.email, password: "wrong-password" });
    expect(res.status).toBe(401);
  });

  it("rejects an unknown email", async () => {
    const res = await request(app).post("/auth/login").send({ email: "nobody@example.com", password: "password123" });
    expect(res.status).toBe(401);
  });
});

describe("GET /auth/me", () => {
  it("returns the authenticated user", async () => {
    const { token, user } = await registerPhysio({ fullName: "Sarah Johnson" });
    const res = await request(app).get("/auth/me").set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
    expect(res.body.user.physioProfile.fullName).toBe("Sarah Johnson");
  });

  it("rejects a missing token", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects a malformed token", async () => {
    const res = await request(app).get("/auth/me").set({ Authorization: "Bearer not-a-real-token" });
    expect(res.status).toBe(401);
  });
});
