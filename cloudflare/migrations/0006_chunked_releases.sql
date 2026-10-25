-- Keep the original release records intact, including for older Worker versions.
-- The new catalog supports APKs stored as multiple bounded KV values.
CREATE TABLE IF NOT EXISTS "GrowingAppReleasesV2" (
  "VersionCode" INTEGER PRIMARY KEY CHECK("VersionCode" BETWEEN 1 AND 2147483647),
  "VersionName" TEXT NOT NULL,
  "Filename" TEXT NOT NULL UNIQUE,
  "Sha256" TEXT NOT NULL,
  "SizeBytes" INTEGER NOT NULL CHECK("SizeBytes">0 AND "SizeBytes"<=104857600),
  "Manifest" TEXT NOT NULL,
  "PublishedAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
INSERT OR IGNORE INTO "GrowingAppReleasesV2"
  ("VersionCode","VersionName","Filename","Sha256","SizeBytes","Manifest","PublishedAt")
SELECT "VersionCode","VersionName","Filename","Sha256","SizeBytes","Manifest","PublishedAt"
FROM "GrowingAppReleases";
