ALTER TABLE "GrowingPhotoQuestions" ADD COLUMN "Figures" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "GrowingPhotoQuestions" ADD COLUMN "FigureImage" TEXT NOT NULL DEFAULT '';
ALTER TABLE "GrowingPhotoQuestions" ADD COLUMN "FigureVersion" INTEGER NOT NULL DEFAULT 1;
