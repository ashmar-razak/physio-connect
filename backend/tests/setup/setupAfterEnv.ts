import { prisma } from "../../src/db";
import { resetDb } from "./resetDb";

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});
