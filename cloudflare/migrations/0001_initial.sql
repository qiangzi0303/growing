-- Cloudflare D1 / SQLite. Additive migration; no DROP or data replacement.
CREATE TABLE IF NOT EXISTS "GrowingUsers" (
  "Id" TEXT PRIMARY KEY NOT NULL,
  "Username" TEXT NOT NULL CHECK(length("Username") BETWEEN 2 AND 24),
  "NormalizedName" TEXT NOT NULL UNIQUE,
  "DisplayName" TEXT NOT NULL CHECK(length("DisplayName") BETWEEN 1 AND 40),
  "SearchName" TEXT NOT NULL DEFAULT '',
  "Role" TEXT NOT NULL CHECK("Role" IN ('Student','Parent')),
  "PasswordHash" TEXT NOT NULL,
  "CreatedAt" TEXT NOT NULL,
  "SyncRevision" INTEGER NOT NULL DEFAULT 0 CONSTRAINT growing_sync_cas CHECK("SyncRevision">=0)
);
CREATE TABLE IF NOT EXISTS "GrowingSessions" (
  "TokenHash" TEXT PRIMARY KEY NOT NULL,
  "UserId" TEXT NOT NULL REFERENCES "GrowingUsers"("Id") ON DELETE RESTRICT,
  "ExpiresAt" TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "IX_GrowingSessions_UserId" ON "GrowingSessions"("UserId");
CREATE TABLE IF NOT EXISTS "GrowingFamilyLinks" (
  "ParentId" TEXT NOT NULL REFERENCES "GrowingUsers"("Id") ON DELETE RESTRICT,
  "StudentId" TEXT NOT NULL REFERENCES "GrowingUsers"("Id") ON DELETE RESTRICT,
  "CreatedAt" TEXT NOT NULL,
  PRIMARY KEY("ParentId","StudentId")
);
CREATE INDEX IF NOT EXISTS "IX_GrowingFamilyLinks_StudentId" ON "GrowingFamilyLinks"("StudentId");
CREATE TABLE IF NOT EXISTS "GrowingInvitations" (
  "CodeHash" TEXT PRIMARY KEY NOT NULL,
  "StudentId" TEXT NOT NULL REFERENCES "GrowingUsers"("Id") ON DELETE RESTRICT,
  "ExpiresAt" TEXT NOT NULL,
  "UsedBy" TEXT,
  "ClaimId" TEXT
);
CREATE INDEX IF NOT EXISTS "IX_GrowingInvitations_StudentId" ON "GrowingInvitations"("StudentId");
CREATE TABLE IF NOT EXISTS "GrowingDocuments" (
  "StudentId" TEXT NOT NULL REFERENCES "GrowingUsers"("Id") ON DELETE RESTRICT,
  "Key" TEXT NOT NULL CHECK(length("Key")<=200),
  "Value" TEXT,
  "Revision" INTEGER NOT NULL CHECK("Revision">0),
  "UpdatedAt" TEXT NOT NULL,
  PRIMARY KEY("StudentId","Key")
);
CREATE INDEX IF NOT EXISTS "IX_GrowingDocuments_UpdatedAt" ON "GrowingDocuments"("UpdatedAt");
CREATE TABLE IF NOT EXISTS "GrowingAdministrators" (
  "UserId" TEXT PRIMARY KEY NOT NULL REFERENCES "GrowingUsers"("Id") ON DELETE RESTRICT,
  "CreatedAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS "GrowingDailySnapshots" (
  "StudentId" TEXT NOT NULL REFERENCES "GrowingUsers"("Id") ON DELETE RESTRICT,
  "Day" TEXT NOT NULL,
  "Subject" TEXT NOT NULL CHECK("Subject" IN ('数学','英语','物理')),
  "Read" INTEGER NOT NULL CHECK("Read">=0),
  "Mastered" INTEGER NOT NULL CHECK("Mastered">=0),
  "Practice" INTEGER NOT NULL CHECK("Practice">=0),
  "UpdatedAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY("StudentId","Day","Subject")
);
CREATE TABLE IF NOT EXISTS "GrowingRewardConfirmations" (
  "Id" TEXT PRIMARY KEY NOT NULL,
  "StudentId" TEXT NOT NULL REFERENCES "GrowingUsers"("Id") ON DELETE RESTRICT,
  "ParentId" TEXT NOT NULL REFERENCES "GrowingUsers"("Id") ON DELETE RESTRICT,
  "DocumentKey" TEXT NOT NULL,
  "EntryHash" TEXT NOT NULL,
  "Kind" TEXT NOT NULL CHECK("Kind" IN ('game','cash')),
  "Amount" INTEGER NOT NULL CHECK("Amount">0),
  "ClaimedParent" TEXT NOT NULL,
  "ClaimedAt" TEXT NOT NULL,
  "ConfirmedAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE("StudentId","DocumentKey","EntryHash")
);
CREATE INDEX IF NOT EXISTS "IX_GrowingRewardConfirmations_Parent" ON "GrowingRewardConfirmations"("ParentId","ConfirmedAt" DESC);
CREATE INDEX IF NOT EXISTS "IX_GrowingRewardConfirmations_Time" ON "GrowingRewardConfirmations"("ConfirmedAt" DESC);
