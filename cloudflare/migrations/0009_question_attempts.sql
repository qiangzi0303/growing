CREATE TABLE IF NOT EXISTS "GrowingQuestionAttempts" (
  "StudentId" TEXT NOT NULL REFERENCES "GrowingUsers"("Id"),
  "AttemptId" TEXT NOT NULL,
  "Kind" TEXT NOT NULL CHECK ("Kind" IN ('math','photo')),
  "QuestionId" TEXT NOT NULL,
  "Correct" INTEGER NOT NULL CHECK ("Correct" IN (0,1)),
  "ActorId" TEXT NOT NULL REFERENCES "GrowingUsers"("Id"),
  "CreatedAt" TEXT NOT NULL,
  PRIMARY KEY ("StudentId","AttemptId")
);
CREATE INDEX IF NOT EXISTS "IX_GrowingQuestionAttempts_Question"
  ON "GrowingQuestionAttempts" ("StudentId","Kind","QuestionId","CreatedAt");
