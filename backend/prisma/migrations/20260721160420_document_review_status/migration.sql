-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "physioProfileId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "reviewedAt" DATETIME,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Document_physioProfileId_fkey" FOREIGN KEY ("physioProfileId") REFERENCES "PhysioProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Document" ("fileName", "fileUrl", "id", "mimeType", "physioProfileId", "type", "uploadedAt") SELECT "fileName", "fileUrl", "id", "mimeType", "physioProfileId", "type", "uploadedAt" FROM "Document";
DROP TABLE "Document";
ALTER TABLE "new_Document" RENAME TO "Document";
CREATE INDEX "Document_physioProfileId_idx" ON "Document"("physioProfileId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
