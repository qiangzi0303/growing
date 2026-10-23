-- Derived indexes only; original learning documents remain the source of truth.
CREATE TABLE IF NOT EXISTS "GrowingRankings" (
  "StudentId" TEXT NOT NULL REFERENCES "GrowingUsers"("Id") ON DELETE RESTRICT,
  "BoardId" TEXT NOT NULL,
  "Kind" TEXT NOT NULL CHECK("Kind" IN ('unit','course')),
  "Subject" TEXT NOT NULL CHECK("Subject" IN ('math','english','physics')),
  "Term" TEXT NOT NULL CHECK("Term" IN ('upper','lower')),
  "Title" TEXT NOT NULL,
  "ConceptDone" INTEGER NOT NULL CHECK("ConceptDone">=0 AND "ConceptDone"<="ConceptTotal"),
  "ConceptTotal" INTEGER NOT NULL CHECK("ConceptTotal">0),
  "TestDone" REAL NOT NULL CHECK("TestDone">=0 AND "TestDone"<="TestTotal"),
  "TestTotal" INTEGER NOT NULL CHECK("TestTotal">0),
  "Score" INTEGER NOT NULL CHECK("Score" BETWEEN 0 AND 10000),
  "UpdatedAt" TEXT NOT NULL,
  PRIMARY KEY("StudentId","BoardId")
);
CREATE INDEX IF NOT EXISTS "IX_GrowingRankings_BoardScore" ON "GrowingRankings"("BoardId","Score" DESC,"StudentId");
