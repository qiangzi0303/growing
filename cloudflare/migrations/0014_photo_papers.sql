-- A nullable override preserves the model's original assessment for comparison.
ALTER TABLE "GrowingPhotoQuestions" ADD COLUMN "PaperWrong" INTEGER CHECK ("PaperWrong" IS NULL OR "PaperWrong" IN (0,1));
