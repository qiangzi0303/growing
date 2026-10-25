CREATE TABLE IF NOT EXISTS "GrowingStudyTime" (
  "StudentId" TEXT NOT NULL REFERENCES "GrowingUsers"("Id"),
  "Day" TEXT NOT NULL,
  "Subject" TEXT NOT NULL CHECK ("Subject" IN ('数学','英语','物理')),
  "Seconds" REAL NOT NULL CHECK ("Seconds">=0 AND "Seconds"<=86400),
  "UpdatedAt" TEXT NOT NULL,
  PRIMARY KEY ("StudentId","Day","Subject")
);
