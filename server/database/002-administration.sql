-- Run after 001-initial.sql. Adds tables only; preserves existing users and documents.
BEGIN;
CREATE TABLE IF NOT EXISTS "GrowingAdministrators" (
  "UserId" uuid PRIMARY KEY REFERENCES "GrowingUsers" ("Id") ON DELETE RESTRICT,
  "CreatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "GrowingDailySnapshots" (
  "StudentId" uuid NOT NULL REFERENCES "GrowingUsers" ("Id") ON DELETE RESTRICT,
  "Day" date NOT NULL,
  "Subject" varchar(10) NOT NULL CHECK ("Subject" IN ('数学','英语','物理')),
  "Read" integer NOT NULL CHECK ("Read">=0),
  "Mastered" integer NOT NULL CHECK ("Mastered">=0),
  "Practice" integer NOT NULL CHECK ("Practice">=0),
  "UpdatedAt" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("StudentId","Day","Subject")
);
CREATE TABLE IF NOT EXISTS "GrowingRewardConfirmations" (
  "Id" uuid PRIMARY KEY,
  "StudentId" uuid NOT NULL REFERENCES "GrowingUsers" ("Id") ON DELETE RESTRICT,
  "ParentId" uuid NOT NULL REFERENCES "GrowingUsers" ("Id") ON DELETE RESTRICT,
  "DocumentKey" varchar(200) NOT NULL,
  "EntryHash" varchar(64) NOT NULL,
  "Kind" varchar(10) NOT NULL CHECK ("Kind" IN ('game','cash')),
  "Amount" bigint NOT NULL CHECK ("Amount">0),
  "ClaimedParent" varchar(30) NOT NULL,
  "ClaimedAt" timestamptz NOT NULL,
  "ConfirmedAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("StudentId","DocumentKey","EntryHash")
);
CREATE INDEX IF NOT EXISTS "IX_GrowingRewardConfirmations_Parent" ON "GrowingRewardConfirmations" ("ParentId","ConfirmedAt" DESC);
CREATE INDEX IF NOT EXISTS "IX_GrowingRewardConfirmations_Time" ON "GrowingRewardConfirmations" ("ConfirmedAt" DESC);
CREATE INDEX IF NOT EXISTS "IX_GrowingDocuments_UpdatedAt" ON "GrowingDocuments" ("UpdatedAt" DESC);
COMMIT;
