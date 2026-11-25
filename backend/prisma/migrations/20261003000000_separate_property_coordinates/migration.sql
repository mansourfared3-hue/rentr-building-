-- CreateTable
CREATE TABLE "property_locations" (
    "propertyId" UUID NOT NULL,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),

    CONSTRAINT "property_locations_pkey" PRIMARY KEY ("propertyId")
);

-- Migrate existing coordinates before removing them from the public property table.
INSERT INTO "property_locations" ("propertyId", "latitude", "longitude")
SELECT "id", "latitude", "longitude"
FROM "properties"
WHERE "latitude" IS NOT NULL OR "longitude" IS NOT NULL;

-- Drop columns after preserving their values in the private location table.
ALTER TABLE "properties" DROP COLUMN "latitude";
ALTER TABLE "properties" DROP COLUMN "longitude";

-- AddForeignKey
ALTER TABLE "property_locations"
ADD CONSTRAINT "property_locations_propertyId_fkey"
FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
