-- PostgreSQL 16+. Execute in the project's database as a schema owner.
-- Safe to rerun; existing tables and records are not dropped or rebuilt.
-- Quoted names match the Workers SQL queries. This does not migrate SQL Server data.
BEGIN;

CREATE TABLE IF NOT EXISTS "GrowingUsers" (
  "Id" uuid NOT NULL PRIMARY KEY,
  "Username" varchar(24) NOT NULL,
  "NormalizedName" varchar(24) NOT NULL,
  "DisplayName" varchar(40) NOT NULL,
  "Role" varchar(10) NOT NULL CHECK ("Role" IN ('Student', 'Parent')),
  "PasswordHash" varchar(512) NOT NULL,
  "CreatedAt" timestamp with time zone NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_GrowingUsers_NormalizedName" ON "GrowingUsers" ("NormalizedName");

CREATE TABLE IF NOT EXISTS "GrowingSessions" (
  "TokenHash" varchar(64) NOT NULL PRIMARY KEY,
  "UserId" uuid NOT NULL REFERENCES "GrowingUsers" ("Id") ON DELETE RESTRICT,
  "ExpiresAt" timestamp with time zone NOT NULL
);
CREATE INDEX IF NOT EXISTS "IX_GrowingSessions_UserId" ON "GrowingSessions" ("UserId");

CREATE TABLE IF NOT EXISTS "GrowingFamilyLinks" (
  "ParentId" uuid NOT NULL REFERENCES "GrowingUsers" ("Id") ON DELETE RESTRICT,
  "StudentId" uuid NOT NULL REFERENCES "GrowingUsers" ("Id") ON DELETE RESTRICT,
  "CreatedAt" timestamp with time zone NOT NULL,
  PRIMARY KEY ("ParentId", "StudentId")
);
CREATE INDEX IF NOT EXISTS "IX_GrowingFamilyLinks_StudentId" ON "GrowingFamilyLinks" ("StudentId");

CREATE TABLE IF NOT EXISTS "GrowingInvitations" (
  "CodeHash" varchar(64) NOT NULL PRIMARY KEY,
  "StudentId" uuid NOT NULL REFERENCES "GrowingUsers" ("Id") ON DELETE RESTRICT,
  "ExpiresAt" timestamp with time zone NOT NULL,
  "UsedBy" uuid NULL
);
CREATE INDEX IF NOT EXISTS "IX_GrowingInvitations_StudentId" ON "GrowingInvitations" ("StudentId");

CREATE TABLE IF NOT EXISTS "GrowingDocuments" (
  "StudentId" uuid NOT NULL REFERENCES "GrowingUsers" ("Id") ON DELETE RESTRICT,
  "Key" varchar(200) NOT NULL,
  "Value" text NULL,
  "Revision" bigint NOT NULL CHECK ("Revision" > 0),
  "UpdatedAt" timestamp with time zone NOT NULL,
  PRIMARY KEY ("StudentId", "Key")
);

COMMIT;
