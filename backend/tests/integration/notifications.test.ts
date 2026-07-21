import request from "supertest";
import { app, authHeader, createAcceptedBooking, createAdmin, createOpenRequest, registerClub, registerPhysio } from "../helpers";

describe("notifications", () => {
  it("notifies the club when a physio applies", async () => {
    const { token: clubToken } = await registerClub();
    const { token: physioToken, user: physio } = await registerPhysio({ fullName: "James Carter" });
    const coverRequest = await createOpenRequest(clubToken);

    await request(app).post(`/requests/${coverRequest.id}/apply`).set(authHeader(physioToken));

    const list = await request(app).get("/notifications").set(authHeader(clubToken));
    expect(list.body.notifications).toHaveLength(1);
    expect(list.body.notifications[0].type).toBe("NEW_APPLICATION");
    expect(list.body.notifications[0].body).toContain("James Carter");
    expect(list.body.notifications[0].read).toBe(false);

    void physio;
  });

  it("notifies the accepted physio and auto-declines the other applicant", async () => {
    const { token: clubToken } = await registerClub();
    const { token: physioAToken } = await registerPhysio({ fullName: "Physio A" });
    const { token: physioBToken } = await registerPhysio({ fullName: "Physio B" });
    const coverRequest = await createOpenRequest(clubToken);

    const appA = await request(app).post(`/requests/${coverRequest.id}/apply`).set(authHeader(physioAToken));
    await request(app).post(`/requests/${coverRequest.id}/apply`).set(authHeader(physioBToken));

    await request(app).post(`/requests/applications/${appA.body.application.id}/accept`).set(authHeader(clubToken));

    const aNotifications = await request(app).get("/notifications").set(authHeader(physioAToken));
    expect(aNotifications.body.notifications[0].type).toBe("APPLICATION_ACCEPTED");

    const bNotifications = await request(app).get("/notifications").set(authHeader(physioBToken));
    expect(bNotifications.body.notifications[0].type).toBe("APPLICATION_DECLINED");
  });

  it("notifies a physio when their application is manually declined", async () => {
    const { token: clubToken } = await registerClub();
    const { token: physioToken } = await registerPhysio();
    const coverRequest = await createOpenRequest(clubToken);
    const applied = await request(app).post(`/requests/${coverRequest.id}/apply`).set(authHeader(physioToken));

    await request(app)
      .post(`/requests/applications/${applied.body.application.id}/decline`)
      .set(authHeader(clubToken));

    const notifications = await request(app).get("/notifications").set(authHeader(physioToken));
    expect(notifications.body.notifications[0].type).toBe("APPLICATION_DECLINED");
  });

  it("notifies the rated party after a new rating", async () => {
    const { token: clubToken } = await registerClub();
    const { token: physioToken } = await registerPhysio();
    const { booking } = await createAcceptedBooking(clubToken, physioToken);

    await request(app).post(`/bookings/${booking.id}/complete`).set(authHeader(clubToken));
    await request(app).post(`/bookings/${booking.id}/ratings`).set(authHeader(clubToken)).send({ score: 5 });

    const notifications = await request(app).get("/notifications").set(authHeader(physioToken));
    expect(notifications.body.notifications[0].type).toBe("NEW_RATING");
  });

  it("notifies the physio when their document is reviewed and when registration is verified", async () => {
    const { token: adminToken } = await createAdmin();
    const { token: physioToken, user } = await registerPhysio();

    const upload = await request(app)
      .post("/physios/me/documents")
      .set(authHeader(physioToken))
      .field("type", "INSURANCE")
      .attach("file", Buffer.from("%PDF-1.4"), { filename: "insurance.pdf", contentType: "application/pdf" });

    await request(app).post(`/admin/documents/${upload.body.document.id}/review`).set(authHeader(adminToken)).send({ status: "APPROVED" });
    await request(app)
      .post(`/admin/physios/${user.physioProfile.id}/registration-verification`)
      .set(authHeader(adminToken))
      .send({ verified: true });

    const notifications = await request(app).get("/notifications").set(authHeader(physioToken));
    const types = notifications.body.notifications.map((n: { type: string }) => n.type);
    expect(types).toContain("DOCUMENT_REVIEWED");
    expect(types).toContain("REGISTRATION_VERIFIED");
  });

  it("tracks unread count and supports marking one or all as read", async () => {
    const { token: clubToken } = await registerClub();
    const { token: physioAToken } = await registerPhysio();
    const { token: physioBToken } = await registerPhysio();
    const requestA = await createOpenRequest(clubToken);
    const requestB = await createOpenRequest(clubToken);

    await request(app).post(`/requests/${requestA.id}/apply`).set(authHeader(physioAToken));
    await request(app).post(`/requests/${requestB.id}/apply`).set(authHeader(physioBToken));

    const countRes = await request(app).get("/notifications/unread-count").set(authHeader(clubToken));
    expect(countRes.body.count).toBe(2);

    const list = await request(app).get("/notifications").set(authHeader(clubToken));
    const firstId = list.body.notifications[0].id;

    const markOne = await request(app).post(`/notifications/${firstId}/read`).set(authHeader(clubToken));
    expect(markOne.status).toBe(200);
    expect(markOne.body.notification.read).toBe(true);

    const countAfterOne = await request(app).get("/notifications/unread-count").set(authHeader(clubToken));
    expect(countAfterOne.body.count).toBe(1);

    const markAll = await request(app).post("/notifications/read-all").set(authHeader(clubToken));
    expect(markAll.status).toBe(204);

    const countAfterAll = await request(app).get("/notifications/unread-count").set(authHeader(clubToken));
    expect(countAfterAll.body.count).toBe(0);
  });

  it("prevents marking another user's notification as read", async () => {
    const { token: clubToken } = await registerClub();
    const { token: physioToken } = await registerPhysio();
    const coverRequest = await createOpenRequest(clubToken);
    await request(app).post(`/requests/${coverRequest.id}/apply`).set(authHeader(physioToken));

    const list = await request(app).get("/notifications").set(authHeader(clubToken));
    const notificationId = list.body.notifications[0].id;

    const res = await request(app).post(`/notifications/${notificationId}/read`).set(authHeader(physioToken));
    expect(res.status).toBe(404);
  });
});
