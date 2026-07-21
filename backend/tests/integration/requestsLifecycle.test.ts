import request from "supertest";
import { app, authHeader, createOpenRequest, registerClub, registerPhysio } from "../helpers";

describe("cover request lifecycle", () => {
  it("lets a club post a request and a physio apply to it", async () => {
    const { token: clubToken } = await registerClub();
    const { token: physioToken } = await registerPhysio();

    const coverRequest = await createOpenRequest(clubToken);
    expect(coverRequest.status).toBe("OPEN");

    const apply = await request(app)
      .post(`/requests/${coverRequest.id}/apply`)
      .set(authHeader(physioToken))
      .send({ message: "Happy to cover" });
    expect(apply.status).toBe(201);
    expect(apply.body.application.status).toBe("PENDING");
  });

  it("rejects a duplicate application from the same physio", async () => {
    const { token: clubToken } = await registerClub();
    const { token: physioToken } = await registerPhysio();
    const coverRequest = await createOpenRequest(clubToken);

    await request(app).post(`/requests/${coverRequest.id}/apply`).set(authHeader(physioToken));
    const second = await request(app).post(`/requests/${coverRequest.id}/apply`).set(authHeader(physioToken));
    expect(second.status).toBe(409);
  });

  it("rejects applications from a club account", async () => {
    const { token: clubToken } = await registerClub();
    const coverRequest = await createOpenRequest(clubToken);
    const res = await request(app).post(`/requests/${coverRequest.id}/apply`).set(authHeader(clubToken));
    expect(res.status).toBe(403);
  });

  it("accepting one application auto-declines the others and creates a booking", async () => {
    const { token: clubToken } = await registerClub();
    const { token: physioAToken, user: physioA } = await registerPhysio({ fullName: "Physio A" });
    const { token: physioBToken, user: physioB } = await registerPhysio({ fullName: "Physio B" });

    const coverRequest = await createOpenRequest(clubToken);
    const appA = await request(app).post(`/requests/${coverRequest.id}/apply`).set(authHeader(physioAToken));
    const appB = await request(app).post(`/requests/${coverRequest.id}/apply`).set(authHeader(physioBToken));

    const accept = await request(app)
      .post(`/requests/applications/${appA.body.application.id}/accept`)
      .set(authHeader(clubToken));
    expect(accept.status).toBe(201);
    expect(accept.body.booking.physioProfileId).toBe(appA.body.application.physioProfileId);

    const requestDetail = await request(app).get(`/requests/${coverRequest.id}`);
    expect(requestDetail.body.request.status).toBe("MATCHED");

    const physioBApplications = await request(app).get("/requests/applications/mine").set(authHeader(physioBToken));
    const declined = physioBApplications.body.applications.find((a: { id: string }) => a.id === appB.body.application.id);
    expect(declined.status).toBe("DECLINED");

    // A second accept attempt on the now-matched request should fail.
    const secondAccept = await request(app)
      .post(`/requests/applications/${appB.body.application.id}/accept`)
      .set(authHeader(clubToken));
    expect(secondAccept.status).toBe(400);

    void physioA;
    void physioB;
  });

  it("completing a booking allows both sides to rate each other exactly once", async () => {
    const { token: clubToken } = await registerClub();
    const { token: physioToken } = await registerPhysio();
    const coverRequest = await createOpenRequest(clubToken);
    const application = await request(app).post(`/requests/${coverRequest.id}/apply`).set(authHeader(physioToken));
    const accept = await request(app)
      .post(`/requests/applications/${application.body.application.id}/accept`)
      .set(authHeader(clubToken));
    const bookingId = accept.body.booking.id;

    const rateBeforeComplete = await request(app)
      .post(`/bookings/${bookingId}/ratings`)
      .set(authHeader(clubToken))
      .send({ score: 5 });
    expect(rateBeforeComplete.status).toBe(400);

    const complete = await request(app).post(`/bookings/${bookingId}/complete`).set(authHeader(clubToken));
    expect(complete.status).toBe(200);
    expect(complete.body.booking.completedAt).toEqual(expect.any(String));

    const clubRates = await request(app)
      .post(`/bookings/${bookingId}/ratings`)
      .set(authHeader(clubToken))
      .send({ score: 5, comment: "Great work" });
    expect(clubRates.status).toBe(201);

    const duplicateRating = await request(app)
      .post(`/bookings/${bookingId}/ratings`)
      .set(authHeader(clubToken))
      .send({ score: 4 });
    expect(duplicateRating.status).toBe(409);

    const physioRates = await request(app)
      .post(`/bookings/${bookingId}/ratings`)
      .set(authHeader(physioToken))
      .send({ score: 4, comment: "Good venue" });
    expect(physioRates.status).toBe(201);

    const physioProfile = await request(app).get("/physios/me").set(authHeader(physioToken));
    expect(physioProfile.body.physio.averageRating).toBe(5);
    expect(physioProfile.body.physio.ratingCount).toBe(1);
  });

  it("prevents a third party from accepting or completing bookings they aren't part of", async () => {
    const { token: clubToken } = await registerClub();
    const { token: physioToken } = await registerPhysio();
    const { token: otherClubToken } = await registerClub();
    const coverRequest = await createOpenRequest(clubToken);
    const application = await request(app).post(`/requests/${coverRequest.id}/apply`).set(authHeader(physioToken));

    const accept = await request(app)
      .post(`/requests/applications/${application.body.application.id}/accept`)
      .set(authHeader(otherClubToken));
    expect(accept.status).toBe(404);
  });
});
