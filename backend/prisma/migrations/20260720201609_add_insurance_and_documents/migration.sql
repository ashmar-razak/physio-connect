-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "physioProfileId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Document_physioProfileId_fkey" FOREIGN KEY ("physioProfileId") REFERENCES "PhysioProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PhysioProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "bio" TEXT,
    "locationText" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "travelRadiusMiles" INTEGER NOT NULL DEFAULT 20,
    "registrationBody" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "registrationVerified" BOOLEAN NOT NULL DEFAULT false,
    "hasInsurance" BOOLEAN NOT NULL DEFAULT false,
    "insurer" TEXT,
    "insurancePolicyNumber" TEXT,
    "insuranceExpiryDate" DATETIME,
    "insuranceCoversPitchside" TEXT,
    "yearsExperience" INTEGER NOT NULL DEFAULT 0,
    "dayRate" REAL,
    "sports" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PhysioProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PhysioProfile" ("bio", "createdAt", "dayRate", "fullName", "id", "latitude", "locationText", "longitude", "phone", "registrationBody", "registrationNumber", "registrationVerified", "sports", "travelRadiusMiles", "updatedAt", "userId", "yearsExperience") SELECT "bio", "createdAt", "dayRate", "fullName", "id", "latitude", "locationText", "longitude", "phone", "registrationBody", "registrationNumber", "registrationVerified", "sports", "travelRadiusMiles", "updatedAt", "userId", "yearsExperience" FROM "PhysioProfile";
DROP TABLE "PhysioProfile";
ALTER TABLE "new_PhysioProfile" RENAME TO "PhysioProfile";
CREATE UNIQUE INDEX "PhysioProfile_userId_key" ON "PhysioProfile"("userId");
CREATE INDEX "PhysioProfile_latitude_longitude_idx" ON "PhysioProfile"("latitude", "longitude");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Document_physioProfileId_idx" ON "Document"("physioProfileId");
