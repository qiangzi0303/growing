-- Preserve the existing parent table and every child foreign key. The old constrained column remains as a compatibility snapshot.
ALTER TABLE "GrowingQuestionPapers" RENAME COLUMN "Subject" TO "LegacySubject";
ALTER TABLE "GrowingQuestionPapers" ADD COLUMN "Subject" TEXT NOT NULL DEFAULT 'math' CHECK ("Subject" IN ('math','english','physics'));
UPDATE "GrowingQuestionPapers" SET "Subject"="LegacySubject";
DROP INDEX "GrowingQuestionPapers_StudentSubject";
CREATE INDEX "GrowingQuestionPapers_StudentSubject" ON "GrowingQuestionPapers" ("StudentId","Subject");
ALTER TABLE "GrowingQuestionPapers" ADD COLUMN "Classification" TEXT NOT NULL DEFAULT '';
