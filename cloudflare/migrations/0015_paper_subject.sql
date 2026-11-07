ALTER TABLE "GrowingQuestionPapers" ADD COLUMN "Subject" TEXT NOT NULL DEFAULT 'math' CHECK ("Subject" IN ('math','english'));
CREATE INDEX "GrowingQuestionPapers_StudentSubject" ON "GrowingQuestionPapers" ("StudentId","Subject");
