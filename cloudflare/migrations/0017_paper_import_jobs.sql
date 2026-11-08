CREATE TABLE "GrowingPaperImportJobs" (
 "Id" TEXT PRIMARY KEY,
 "StudentId" TEXT NOT NULL REFERENCES "GrowingUsers"("Id"),
 "RequestId" TEXT NOT NULL,
 "Fingerprint" TEXT NOT NULL,
 "Subject" TEXT NOT NULL,
 "State" TEXT NOT NULL,
 "Revision" INTEGER NOT NULL DEFAULT 0,
 "LeaseToken" TEXT NOT NULL DEFAULT '',
 "LeaseUntil" INTEGER NOT NULL DEFAULT 0,
 "CreatedAt" TEXT NOT NULL,
 UNIQUE("StudentId","RequestId")
);
CREATE INDEX "GrowingPaperImportJobsStudent" ON "GrowingPaperImportJobs"("StudentId","CreatedAt");
CREATE TABLE "GrowingPaperImportJobPages" (
 "JobId" TEXT NOT NULL REFERENCES "GrowingPaperImportJobs"("Id"),
 "Page" INTEGER NOT NULL,
 "Image" TEXT NOT NULL,
 PRIMARY KEY("JobId","Page")
);
