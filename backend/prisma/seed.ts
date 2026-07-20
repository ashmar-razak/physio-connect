import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Hardcoded UK coordinates so seeding works offline (no geocoding calls).
const PLACES = {
  manchester: { text: "Manchester, UK", lat: 53.4808, lng: -2.2426 },
  leeds: { text: "Leeds, UK", lat: 53.8008, lng: -1.5491 },
  sheffield: { text: "Sheffield, UK", lat: 53.3811, lng: -1.4701 },
  nottingham: { text: "Nottingham, UK", lat: 52.9548, lng: -1.1581 },
  loughborough: { text: "Loughborough, UK", lat: 52.7721, lng: -1.2062 },
};

const SEED_PASSWORD = "password123";

async function main() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  await prisma.rating.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.application.deleteMany();
  await prisma.coverRequest.deleteMany();
  await prisma.certification.deleteMany();
  await prisma.physioProfile.deleteMany();
  await prisma.clubProfile.deleteMany();
  await prisma.user.deleteMany();

  const sarah = await prisma.user.create({
    data: {
      email: "sarah.physio@example.com",
      passwordHash,
      role: "PHYSIO",
      physioProfile: {
        create: {
          fullName: "Sarah Johnson",
          phone: "07700 900001",
          bio: "HCPC-registered physio, 6 years in grassroots and semi-pro football.",
          locationText: PLACES.manchester.text,
          latitude: PLACES.manchester.lat,
          longitude: PLACES.manchester.lng,
          travelRadiusMiles: 25,
          registrationBody: "HCPC",
          registrationNumber: "PH123456",
          registrationVerified: true,
          yearsExperience: 6,
          dayRate: 180,
          sports: "football,rugby",
          certifications: {
            create: [
              { type: "PHICIS", issuingBody: "FA", issueDate: new Date("2023-01-10") },
              { type: "DBS_ENHANCED", issuingBody: "DBS", issueDate: new Date("2024-03-01") },
              { type: "FIRST_AID_AT_WORK", issuingBody: "Red Cross", issueDate: new Date("2023-06-15") },
            ],
          },
        },
      },
    },
    include: { physioProfile: true },
  });

  const james = await prisma.user.create({
    data: {
      email: "james.physio@example.com",
      passwordHash,
      role: "PHYSIO",
      physioProfile: {
        create: {
          fullName: "James Carter",
          phone: "07700 900002",
          bio: "CSP member specialising in pitchside trauma care for rugby.",
          locationText: PLACES.leeds.text,
          latitude: PLACES.leeds.lat,
          longitude: PLACES.leeds.lng,
          travelRadiusMiles: 30,
          registrationBody: "CSP",
          registrationNumber: "CSP987654",
          registrationVerified: true,
          yearsExperience: 9,
          dayRate: 220,
          sports: "rugby,hockey",
          certifications: {
            create: [
              { type: "PHICIS", issuingBody: "RFU" },
              { type: "ATMMIF", issuingBody: "RFU" },
              { type: "RFU_PITCHSIDE", issuingBody: "RFU" },
              { type: "DBS_ENHANCED", issuingBody: "DBS" },
              { type: "AED", issuingBody: "British Heart Foundation" },
            ],
          },
        },
      },
    },
    include: { physioProfile: true },
  });

  const amara = await prisma.user.create({
    data: {
      email: "amara.physio@example.com",
      passwordHash,
      role: "PHYSIO",
      physioProfile: {
        create: {
          fullName: "Amara Okafor",
          phone: "07700 900003",
          bio: "HCPC-registered, newly qualified, keen to build sports cover experience.",
          locationText: PLACES.sheffield.text,
          latitude: PLACES.sheffield.lat,
          longitude: PLACES.sheffield.lng,
          travelRadiusMiles: 15,
          registrationBody: "HCPC",
          registrationNumber: "PH445566",
          registrationVerified: false,
          yearsExperience: 1,
          dayRate: 120,
          sports: "netball,basketball",
          certifications: { create: [{ type: "DBS_BASIC", issuingBody: "DBS" }] },
        },
      },
    },
    include: { physioProfile: true },
  });

  await prisma.user.create({
    data: {
      email: "tom.physio@example.com",
      passwordHash,
      role: "PHYSIO",
      physioProfile: {
        create: {
          fullName: "Tom Wallace",
          phone: "07700 900004",
          bio: "HCPC-registered physio, just joined the platform.",
          locationText: PLACES.nottingham.text,
          latitude: PLACES.nottingham.lat,
          longitude: PLACES.nottingham.lng,
          travelRadiusMiles: 20,
          registrationBody: "HCPC",
          registrationNumber: "PH778899",
          yearsExperience: 3,
          sports: "football",
        },
      },
    },
  });

  const loughboroughFc = await prisma.user.create({
    data: {
      email: "welfare@loughboroughfc.example.com",
      passwordHash,
      role: "CLUB",
      clubProfile: {
        create: {
          clubName: "Loughborough Town FC",
          sport: "football",
          contactName: "Priya Nair",
          contactRole: "Welfare Officer",
          phone: "07700 900010",
          locationText: PLACES.loughborough.text,
          latitude: PLACES.loughborough.lat,
          longitude: PLACES.loughborough.lng,
        },
      },
    },
    include: { clubProfile: true },
  });

  await prisma.user.create({
    data: {
      email: "manager@leedsrugby.example.com",
      passwordHash,
      role: "CLUB",
      clubProfile: {
        create: {
          clubName: "Leeds Rugby Academy",
          sport: "rugby",
          contactName: "Dan Fisher",
          contactRole: "Team Manager",
          phone: "07700 900011",
          locationText: PLACES.leeds.text,
          latitude: PLACES.leeds.lat,
          longitude: PLACES.leeds.lng,
        },
      },
    },
  });

  // A completed, rated booking between Loughborough Town FC and Sarah, plus
  // one still-open cover request so there's something to browse/apply to.
  const openRequest = await prisma.coverRequest.create({
    data: {
      clubProfileId: loughboroughFc.clubProfile!.id,
      dateNeeded: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      startTime: "09:00",
      endTime: "13:00",
      venueName: "Loughborough Town FC Ground",
      venuePostcode: "LE11 3AB",
      sport: "football",
      ageGroup: "U18",
      coverType: "MATCHDAY",
      requiresDbs: true,
      minCertification: "FIRST_AID_AT_WORK",
      budget: 150,
      urgency: "WITHIN_2_WEEKS",
      notes: "Parking available on site, kit provided.",
      status: "OPEN",
    },
  });

  const pastRequest = await prisma.coverRequest.create({
    data: {
      clubProfileId: loughboroughFc.clubProfile!.id,
      dateNeeded: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      startTime: "14:00",
      endTime: "17:00",
      venueName: "Loughborough Town FC Ground",
      venuePostcode: "LE11 3AB",
      sport: "football",
      ageGroup: "Senior",
      coverType: "MATCHDAY",
      requiresDbs: false,
      budget: 140,
      urgency: "THIS_WEEKEND",
      status: "COMPLETED",
    },
  });

  const application = await prisma.application.create({
    data: {
      coverRequestId: pastRequest.id,
      physioProfileId: sarah.physioProfile!.id,
      status: "ACCEPTED",
      message: "Happy to cover this — I know the ground.",
    },
  });

  const booking = await prisma.booking.create({
    data: {
      coverRequestId: pastRequest.id,
      applicationId: application.id,
      physioProfileId: sarah.physioProfile!.id,
      clubProfileId: loughboroughFc.clubProfile!.id,
      completedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.rating.create({
    data: {
      bookingId: booking.id,
      raterId: loughboroughFc.id,
      ratedId: sarah.id,
      score: 5,
      comment: "Brilliant — calm under pressure and great with the players.",
    },
  });
  await prisma.rating.create({
    data: {
      bookingId: booking.id,
      raterId: sarah.id,
      ratedId: loughboroughFc.id,
      score: 5,
      comment: "Well organised, pitch and facilities were great.",
    },
  });

  console.log("Seeded database.");
  console.log(`Sample login: sarah.physio@example.com / ${SEED_PASSWORD}`);
  console.log(`Sample login: welfare@loughboroughfc.example.com / ${SEED_PASSWORD}`);
  console.log(`Open cover request id: ${openRequest.id}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
