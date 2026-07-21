import request from "supertest";
import { app, authHeader, registerClub, registerPhysio } from "../helpers";

describe("GET /physios", () => {
  it("filters by sport", async () => {
    await registerPhysio({ fullName: "Football Phys", sports: ["football"] });
    await registerPhysio({ fullName: "Rugby Phys", sports: ["rugby"] });

    const res = await request(app).get("/physios").query({ sport: "rugby" });
    expect(res.status).toBe(200);
    expect(res.body.physios).toHaveLength(1);
    expect(res.body.physios[0].fullName).toBe("Rugby Phys");
  });

  it("computes trust tier from certification count and sorts by tier descending", async () => {
    const { token: goldToken } = await registerPhysio({ fullName: "Gold Physio" });
    const { token: bronzeToken } = await registerPhysio({ fullName: "Bronze Physio" });
    await registerPhysio({ fullName: "Unverified Physio" });

    for (const type of ["PHICIS", "ATMMIF", "RFU_PITCHSIDE", "DBS_ENHANCED", "AED", "FIRST_AID_AT_WORK"]) {
      await request(app).post("/physios/me/certifications").set(authHeader(goldToken)).send({ type });
    }
    for (const type of ["PHICIS", "DBS_ENHANCED"]) {
      await request(app).post("/physios/me/certifications").set(authHeader(bronzeToken)).send({ type });
    }

    const res = await request(app).get("/physios");
    expect(res.status).toBe(200);
    const byName = Object.fromEntries(res.body.physios.map((p: { fullName: string; trustTier: string }) => [p.fullName, p.trustTier]));
    expect(byName["Gold Physio"]).toBe("GOLD");
    expect(byName["Bronze Physio"]).toBe("BRONZE");
    expect(byName["Unverified Physio"]).toBe("UNVERIFIED");

    // Gold should be ranked before Bronze, which should be ranked before Unverified.
    const names = res.body.physios.map((p: { fullName: string }) => p.fullName);
    expect(names.indexOf("Gold Physio")).toBeLessThan(names.indexOf("Bronze Physio"));
    expect(names.indexOf("Bronze Physio")).toBeLessThan(names.indexOf("Unverified Physio"));
  });

  it("filters by minTrustTier", async () => {
    const { token } = await registerPhysio({ fullName: "Has One Cert" });
    await registerPhysio({ fullName: "Has No Certs" });
    await request(app).post("/physios/me/certifications").set(authHeader(token)).send({ type: "PHICIS" });

    const res = await request(app).get("/physios").query({ minTrustTier: "STANDARD" });
    const names = res.body.physios.map((p: { fullName: string }) => p.fullName);
    expect(names).toContain("Has One Cert");
    expect(names).not.toContain("Has No Certs");
  });

  it("does not expose a physio's document list on the public list endpoint", async () => {
    await registerPhysio();
    const res = await request(app).get("/physios");
    expect(res.body.physios[0].documents).toBeUndefined();
  });
});

describe("PATCH /physios/me", () => {
  it("updates profile fields for the authenticated physio only", async () => {
    const { token } = await registerPhysio({ fullName: "Original Name" });
    const res = await request(app).patch("/physios/me").set(authHeader(token)).send({ bio: "New bio", dayRate: 150 });
    expect(res.status).toBe(200);
    expect(res.body.physio.bio).toBe("New bio");
    expect(res.body.physio.dayRate).toBe(150);
    expect(res.body.physio.fullName).toBe("Original Name");
  });

  it("rejects a club account", async () => {
    const { token } = await registerClub();
    const res = await request(app).patch("/physios/me").set(authHeader(token)).send({ bio: "nope" });
    expect(res.status).toBe(403);
  });
});

describe("certifications", () => {
  it("adds, updates, and deletes a certification", async () => {
    const { token } = await registerPhysio();

    const create = await request(app)
      .post("/physios/me/certifications")
      .set(authHeader(token))
      .send({ type: "DBS_ENHANCED", issuingBody: "DBS" });
    expect(create.status).toBe(201);
    const certId = create.body.certification.id;

    const update = await request(app)
      .patch(`/physios/me/certifications/${certId}`)
      .set(authHeader(token))
      .send({ issuingBody: "Updated Body" });
    expect(update.status).toBe(200);
    expect(update.body.certification.issuingBody).toBe("Updated Body");

    const del = await request(app).delete(`/physios/me/certifications/${certId}`).set(authHeader(token));
    expect(del.status).toBe(204);

    const me = await request(app).get("/physios/me").set(authHeader(token));
    expect(me.body.physio.certifications).toHaveLength(0);
  });

  it("prevents a physio from editing another physio's certification", async () => {
    const { token: ownerToken } = await registerPhysio();
    const { token: otherToken } = await registerPhysio();

    const create = await request(app).post("/physios/me/certifications").set(authHeader(ownerToken)).send({ type: "AED" });
    const certId = create.body.certification.id;

    const res = await request(app).delete(`/physios/me/certifications/${certId}`).set(authHeader(otherToken));
    expect(res.status).toBe(404);
  });
});

describe("documents", () => {
  it("uploads a document and reflects it on /physios/me but not on the public endpoint", async () => {
    const { token, user } = await registerPhysio();

    const upload = await request(app)
      .post("/physios/me/documents")
      .set(authHeader(token))
      .field("type", "INSURANCE")
      .attach("file", Buffer.from("%PDF-1.4 fake"), { filename: "insurance.pdf", contentType: "application/pdf" });
    expect(upload.status).toBe(201);
    expect(upload.body.document.status).toBe("PENDING");

    const me = await request(app).get("/physios/me").set(authHeader(token));
    expect(me.body.physio.documents).toHaveLength(1);

    const physioId = me.body.physio.id;
    const publicView = await request(app).get(`/physios/${physioId}`);
    expect(publicView.body.physio.documents).toBeUndefined();
  });

  it("rejects a disallowed file type", async () => {
    const { token } = await registerPhysio();
    const res = await request(app)
      .post("/physios/me/documents")
      .set(authHeader(token))
      .field("type", "INSURANCE")
      .attach("file", Buffer.from("echo hi"), { filename: "script.sh", contentType: "application/x-sh" });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
