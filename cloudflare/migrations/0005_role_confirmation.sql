-- Legacy registrations used a preselected role, so require one explicit confirmation.
-- Keep all account IDs, sessions, documents and family links intact.
ALTER TABLE "GrowingUsers" ADD COLUMN "RoleConfirmed" INTEGER NOT NULL DEFAULT 0 CHECK("RoleConfirmed" IN (0,1));
