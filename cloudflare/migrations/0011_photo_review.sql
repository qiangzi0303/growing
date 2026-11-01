ALTER TABLE "GrowingQuestionPapers" ADD COLUMN "Mode" TEXT NOT NULL DEFAULT 'transcribe';
ALTER TABLE "GrowingPhotoQuestions" ADD COLUMN "Regions" TEXT NOT NULL DEFAULT '[]';
CREATE TABLE IF NOT EXISTS "GrowingPhotoGrades" (
  "Id" TEXT PRIMARY KEY,
  "QuestionId" TEXT NOT NULL REFERENCES "GrowingPhotoQuestions"("Id"),
  "RequestId" TEXT NOT NULL,
  "Fingerprint" TEXT NOT NULL,
  "QuestionRevision" INTEGER NOT NULL,
  "Kind" TEXT NOT NULL CHECK ("Kind" IN ('initial','correction')),
  "StudentAnswer" TEXT NOT NULL,
  "Result" TEXT NOT NULL,
  "CreatedAt" TEXT NOT NULL,
  UNIQUE ("QuestionId","RequestId")
);
CREATE INDEX IF NOT EXISTS "GrowingPhotoGradesQuestion" ON "GrowingPhotoGrades" ("QuestionId","CreatedAt");
CREATE TABLE IF NOT EXISTS "GrowingPhotoFollowups" (
  "Id" TEXT PRIMARY KEY,
  "QuestionId" TEXT NOT NULL REFERENCES "GrowingPhotoQuestions"("Id"),
  "GradeId" TEXT NOT NULL REFERENCES "GrowingPhotoGrades"("Id"),
  "RequestId" TEXT NOT NULL,
  "Prompt" TEXT NOT NULL,
  "Reply" TEXT NOT NULL,
  "CreatedAt" TEXT NOT NULL,
  UNIQUE ("QuestionId","RequestId")
);
