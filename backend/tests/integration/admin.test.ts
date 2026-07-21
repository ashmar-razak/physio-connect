import request from "supertest";
import { app, authHeader, createAdmin, registerClub, registerPhysio } from "../helpers";

describe("admin role gating", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app).get("/admin/verification-queue");
    expect(res.status).toBe(401);
  });

  it("rejects physio and club accounts", async () => {
    const { token: physioToken } = await registerPhysio();
    const { token: clubToken } = await registerClub();

    const asPhysio = await request(app).get("/admin/verification-queue").set(authHeader(physioToken));
    expect(asPhysio.status).toBe(403);

    const asClub = await request(app).get("/admin/verification-queue").set(authHeader(clubToken));
    expect(asClub.status).toBe(403);
  });
});

describe("GET /admin/verification-queue", () => {
  it("lists physios with an unverified registration and hides fully-verified ones", async () => {
    const { token: adminToken } = await createAdmin();
    await registerPhysio({ fullName: "Needs Review" });

    const res = await request(app).get("/admin/verification-queue").set(authHeader(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.physios.map((p: { fullName: string }) => p.fullName)).toContain("Needs Review");
  });

  it("includes physios who only have a pending document, even if registration is verified", async () => {
    const { token: adminToken } = await createAdmin();
    const { token: physioToken, user } = await registerPhysio({ fullName: "Verified But Pending Doc" });

    await request(app)
      .post(`/admin/physios/${user.physioProfile.id}/registration-verification`)
      .set(authHeader(adminToken))
      .send({ verified: true });

    await request(app)
      .post("/physios/me/documents")
      .set(authHeader(physioToken))
      .field("type", "INSURANCE")
      .attach("file", Buffer.from("%PDF-1.4"), { filename: "insurance.pdf", contentType: "application/pdf" });

    const queue = await request(app).get("/admin/verification-queue").set(authHeader(adminToken));
    const entry = queue.body.physios.find((p: { fullName: string }) => p.fullName === "Verified But Pending Doc");
    expect(entry).toBeDefined();
    expect(entry.pendingDocumentCount).toBe(1);
  });

  it("excludes a physio once registration is verified and no documents are pending", async () => {
    const { token: adminToken } = await createAdmin();
    const { user } = await registerPhysio({ fullName: "Fully Clear" });

    await request(app)
      .post(`/admin/physios/${user.physioProfile.id}/registration-verification`)
      .set(authHeader(adminToken))
      .send({ verified: true });

    const queue = await request(app).get("/admin/verification-queue").set(authHeader(adminToken));
    expect(queue.body.physios.map((p: { fullName: string }) => p.fullName)).not.toContain("Fully Clear");
  });
});

describe("document review", () => {
  it("approving an insurance document with coversPitchside=YES flips insuranceStatus to VERIFIED", async () => {
    const { token: adminToken } = await createAdmin();
    const { token: physioToken, user } = await registerPhysio();

    await request(app)
      .patch("/physios/me")
      .set(authHeader(physioToken))
      .send({ hasInsurance: true, insuranceCoversPitchside: "YES" });

    const upload = await request(app)
      .post("/physios/me/documents")
      .set(authHeader(physioToken))
      .field("type", "INSURANCE")
      .attach("file", Buffer.from("%PDF-1.4"), { filename: "insurance.pdf", contentType: "application/pdf" });

    let me = await request(app).get("/physios/me").set(authHeader(physioToken));
    expect(me.body.physio.insuranceStatus).toBe("UNCONFIRMED");

    const review = await request(app)
      .post(`/admin/documents/${upload.body.document.id}/review`)
      .set(authHeader(adminToken))
      .send({ status: "APPROVED" });
    expect(review.status).toBe(200);
    expect(review.body.document.status).toBe("APPROVED");

    me = await request(app).get("/physios/me").set(authHeader(physioToken));
    expect(me.body.physio.insuranceStatus).toBe("VERIFIED");

    const publicView = await request(app).get(`/physios/${user.physioProfile.id}`);
    expect(publicView.body.physio.insuranceStatus).toBe("VERIFIED");
  });

  it("rejecting a document preserves the reviewer's note", async () => {
    const { token: adminToken } = await createAdmin();
    const { token: physioToken } = await registerPhysio();

    const upload = await request(app)
      .post("/physios/me/documents")
      .set(authHeader(physioToken))
      .field("type", "REGISTRATION")
      .attach("file", Buffer.from("%PDF-1.4"), { filename: "proof.pdf", contentType: "application/pdf" });

    const review = await request(app)
      .post(`/admin/documents/${upload.body.document.id}/review`)
      .set(authHeader(adminToken))
      .send({ status: "REJECTED", note: "Please re-upload a clearer scan" });
    expect(review.status).toBe(200);
    expect(review.body.document.status).toBe("REJECTED");
    expect(review.body.document.reviewNote).toBe("Please re-upload a clearer scan");
  });

  it("rejects a review status of PENDING", async () => {
    const { token: adminToken } = await createAdmin();
    const { token: physioToken } = await registerPhysio();
    const upload = await request(app)
      .post("/physios/me/documents")
      .set(authHeader(physioToken))
      .field("type", "REGISTRATION")
      .attach("file", Buffer.from("%PDF-1.4"), { filename: "proof.pdf", contentType: "application/pdf" });

    const review = await request(app)
      .post(`/admin/documents/${upload.body.document.id}/review`)
      .set(authHeader(adminToken))
      .send({ status: "PENDING" });
    expect(review.status).toBe(400);
  });
});
