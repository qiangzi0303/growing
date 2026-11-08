ALTER TABLE "GrowingPhotoQuestions" ADD COLUMN "QuestionType" TEXT NOT NULL DEFAULT 'unknown'
 CHECK ("QuestionType" IN ('unknown','choice','fill','written'));
