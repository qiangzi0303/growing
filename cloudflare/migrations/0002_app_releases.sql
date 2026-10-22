-- APK metadata only; binary files are stored in the APK_FILES KV namespace.
CREATE TABLE IF NOT EXISTS "GrowingAppReleases" (
  "VersionCode" INTEGER PRIMARY KEY CHECK("VersionCode" BETWEEN 1 AND 2147483647),
  "VersionName" TEXT NOT NULL,
  "Filename" TEXT NOT NULL UNIQUE,
  "Sha256" TEXT NOT NULL,
  "SizeBytes" INTEGER NOT NULL CHECK("SizeBytes">0 AND "SizeBytes"<=26214400),
  "Manifest" TEXT NOT NULL,
  "PublishedAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
