ALTER TYPE "RentalRequestStatus" ADD VALUE 'ON_HOLD';

CREATE TABLE "admin_whatsapp_outbox" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "propertyTitle" VARCHAR(160) NOT NULL,
    "ownerEmail" VARCHAR(254) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMPTZ(3),
    "sentAt" TIMESTAMPTZ(3),
    "lastError" VARCHAR(1000),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_whatsapp_outbox_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "admin_whatsapp_outbox_sentAt_nextAttemptAt_idx"
ON "admin_whatsapp_outbox"("sentAt", "nextAttemptAt");

ALTER TABLE "admin_whatsapp_outbox"
ADD CONSTRAINT "admin_whatsapp_outbox_requestId_fkey"
FOREIGN KEY ("requestId") REFERENCES "rental_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
