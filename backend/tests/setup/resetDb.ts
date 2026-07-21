import { prisma } from "../../src/db";

// Deletes all rows in dependency order (children before parents). Cheaper
// than re-running migrations between tests, and keeps every test isolated
// from whatever earlier tests inserted.
export async function resetDb(): Promise<void> {
  await prisma.notification.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.application.deleteMany();
  await prisma.coverRequest.deleteMany();
  await prisma.document.deleteMany();
  await prisma.certification.deleteMany();
  await prisma.physioProfile.deleteMany();
  await prisma.clubProfile.deleteMany();
  await prisma.user.deleteMany();
}
