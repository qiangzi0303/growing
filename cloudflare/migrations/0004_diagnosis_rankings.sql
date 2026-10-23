-- Add diagnostic evidence to the derived index. Source learning documents are untouched.
ALTER TABLE "GrowingRankings" ADD COLUMN "DiagnosisTotal" INTEGER NOT NULL DEFAULT 1 CHECK("DiagnosisTotal">0);
ALTER TABLE "GrowingRankings" ADD COLUMN "DiagnosisDone" REAL NOT NULL DEFAULT 0 CHECK("DiagnosisDone">=0 AND "DiagnosisDone"<="DiagnosisTotal");
-- Existing students receive the new 30/40/30 formula immediately, before lazy evidence rebuild.
UPDATE "GrowingRankings" SET "DiagnosisTotal"=CASE "BoardId" WHEN 'math-8b-10' THEN 11 WHEN 'math:lower' THEN 36 ELSE "ConceptTotal" END,
  "Score"=CAST(ROUND(3000.0*"ConceptDone"/"ConceptTotal"+4000.0*"TestDone"/"TestTotal") AS INTEGER);
