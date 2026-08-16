CREATE TABLE "DailyMenuAvailability" (
  "id" SERIAL NOT NULL,
  "date" DATE NOT NULL,
  "available" BOOLEAN NOT NULL DEFAULT true,
  "menuItemId" INTEGER NOT NULL,
  CONSTRAINT "DailyMenuAvailability_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DailyMenuAvailability_menuItemId_date_key" ON "DailyMenuAvailability"("menuItemId", "date");
ALTER TABLE "DailyMenuAvailability" ADD CONSTRAINT "DailyMenuAvailability_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
