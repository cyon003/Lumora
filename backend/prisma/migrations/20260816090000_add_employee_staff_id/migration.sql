ALTER TABLE "Employee" ADD COLUMN "staffId" TEXT;
CREATE UNIQUE INDEX "Employee_branchId_staffId_key" ON "Employee"("branchId", "staffId");
