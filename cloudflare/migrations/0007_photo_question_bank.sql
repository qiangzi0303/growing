CREATE TABLE IF NOT EXISTS "GrowingQuestionPapers" (
  "Id" TEXT PRIMARY KEY,
  "StudentId" TEXT NOT NULL REFERENCES "GrowingUsers"("Id"),
  "RequestId" TEXT NOT NULL,
  "Fingerprint" TEXT NOT NULL,
  "Title" TEXT NOT NULL,
  "Warnings" TEXT NOT NULL,
  "CreatedAt" TEXT NOT NULL,
  UNIQUE ("StudentId", "Fingerprint"),
  UNIQUE ("StudentId", "RequestId")
);
CREATE INDEX IF NOT EXISTS "GrowingQuestionPapersStudent" ON "GrowingQuestionPapers" ("StudentId", "CreatedAt");
CREATE TABLE IF NOT EXISTS "GrowingQuestionPages" (
  "PaperId" TEXT NOT NULL REFERENCES "GrowingQuestionPapers"("Id"),
  "Page" INTEGER NOT NULL,
  "Image" TEXT NOT NULL,
  PRIMARY KEY ("PaperId", "Page")
);
CREATE TABLE IF NOT EXISTS "GrowingPhotoQuestions" (
  "Id" TEXT PRIMARY KEY,
  "PaperId" TEXT NOT NULL REFERENCES "GrowingQuestionPapers"("Id"),
  "Number" TEXT NOT NULL,
  "Text" TEXT NOT NULL,
  "Answer" TEXT NOT NULL,
  "UnitId" TEXT NOT NULL,
  "Reason" TEXT NOT NULL,
  "Uncertain" TEXT NOT NULL,
  "Pages" TEXT NOT NULL,
  "Revision" INTEGER NOT NULL DEFAULT 1,
  "Reviewed" INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS "GrowingPhotoQuestionsPaper" ON "GrowingPhotoQuestions" ("PaperId");
