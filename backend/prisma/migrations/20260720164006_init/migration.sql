-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PhysioProfile" (
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
    "yearsExperience" INTEGER NOT NULL DEFAULT 0,
    "dayRate" REAL,
    "sports" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PhysioProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClubProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "clubName" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactRole" TEXT,
    "phone" TEXT,
    "locationText" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClubProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "physioProfileId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "otherName" TEXT,
    "issuingBody" TEXT,
    "issueDate" DATETIME,
    "expiryDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Certification_physioProfileId_fkey" FOREIGN KEY ("physioProfileId") REFERENCES "PhysioProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CoverRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clubProfileId" TEXT NOT NULL,
    "dateNeeded" DATETIME NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "venueName" TEXT NOT NULL,
    "venuePostcode" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "ageGroup" TEXT NOT NULL,
    "coverType" TEXT NOT NULL,
    "requiresDbs" BOOLEAN NOT NULL DEFAULT false,
    "minCertification" TEXT,
    "budget" REAL,
    "urgency" TEXT NOT NULL DEFAULT 'WITHIN_2_WEEKS',
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CoverRequest_clubProfileId_fkey" FOREIGN KEY ("clubProfileId") REFERENCES "ClubProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coverRequestId" TEXT NOT NULL,
    "physioProfileId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Application_coverRequestId_fkey" FOREIGN KEY ("coverRequestId") REFERENCES "CoverRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Application_physioProfileId_fkey" FOREIGN KEY ("physioProfileId") REFERENCES "PhysioProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coverRequestId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "physioProfileId" TEXT NOT NULL,
    "clubProfileId" TEXT NOT NULL,
    "confirmedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "Booking_coverRequestId_fkey" FOREIGN KEY ("coverRequestId") REFERENCES "CoverRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Booking_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Booking_physioProfileId_fkey" FOREIGN KEY ("physioProfileId") REFERENCES "PhysioProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Booking_clubProfileId_fkey" FOREIGN KEY ("clubProfileId") REFERENCES "ClubProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "raterId" TEXT NOT NULL,
    "ratedId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Rating_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Rating_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Rating_ratedId_fkey" FOREIGN KEY ("ratedId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PhysioProfile_userId_key" ON "PhysioProfile"("userId");

-- CreateIndex
CREATE INDEX "PhysioProfile_latitude_longitude_idx" ON "PhysioProfile"("latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "ClubProfile_userId_key" ON "ClubProfile"("userId");

-- CreateIndex
CREATE INDEX "ClubProfile_latitude_longitude_idx" ON "ClubProfile"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Certification_physioProfileId_idx" ON "Certification"("physioProfileId");

-- CreateIndex
CREATE INDEX "CoverRequest_clubProfileId_idx" ON "CoverRequest"("clubProfileId");

-- CreateIndex
CREATE INDEX "CoverRequest_status_idx" ON "CoverRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Application_coverRequestId_physioProfileId_key" ON "Application"("coverRequestId", "physioProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_coverRequestId_key" ON "Booking"("coverRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_applicationId_key" ON "Booking"("applicationId");

-- CreateIndex
CREATE INDEX "Booking_physioProfileId_idx" ON "Booking"("physioProfileId");

-- CreateIndex
CREATE INDEX "Booking_clubProfileId_idx" ON "Booking"("clubProfileId");

-- CreateIndex
CREATE INDEX "Rating_ratedId_idx" ON "Rating"("ratedId");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_bookingId_raterId_key" ON "Rating"("bookingId", "raterId");
