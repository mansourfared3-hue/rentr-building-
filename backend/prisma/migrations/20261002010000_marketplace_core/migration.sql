-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('APARTMENT', 'HOUSE', 'STUDIO', 'ROOM', 'OTHER');

-- CreateEnum
CREATE TYPE "PropertyFurnishing" AS ENUM ('FURNISHED', 'PARTIALLY_FURNISHED', 'UNFURNISHED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "RentPeriod" AS ENUM ('WEEK', 'MONTH', 'YEAR');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "RentalRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RequestRejectionReason" AS ENUM ('PROFILE', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "WalletEntryReason" AS ENUM ('GRANT', 'REQUEST_RESERVE', 'REQUEST_REFUND', 'REQUEST_CONSUME', 'ADMIN_ADJUSTMENT');

-- CreateTable
CREATE TABLE "tenant_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "occupation" VARCHAR(120) NOT NULL,
    "isStudent" BOOLEAN NOT NULL DEFAULT false,
    "livingArrangement" VARCHAR(24) NOT NULL,
    "familySize" INTEGER NOT NULL DEFAULT 1,
    "moveInDate" DATE NOT NULL,
    "introduction" VARCHAR(1000) NOT NULL,
    "avatarUrl" VARCHAR(2048),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "tenant_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "type" "PropertyType" NOT NULL,
    "community" VARCHAR(120) NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "area" INTEGER NOT NULL,
    "areaUnit" VARCHAR(16) NOT NULL DEFAULT 'm²',
    "furnishing" "PropertyFurnishing" NOT NULL,
    "rent" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'EGP',
    "rentPeriod" "RentPeriod" NOT NULL DEFAULT 'MONTH',
    "availabilityDate" DATE NOT NULL,
    "description" VARCHAR(3000) NOT NULL,
    "images" JSONB NOT NULL,
    "approximateLocation" VARCHAR(180) NOT NULL,
    "address" VARCHAR(500) NOT NULL,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "additionalInfo" VARCHAR(1000),
    "status" "PropertyStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connect_wallets" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "available" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "connect_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_requests" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "profileSnapshot" JSONB NOT NULL,
    "message" VARCHAR(2000) NOT NULL DEFAULT '',
    "status" "RentalRequestStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" "RequestRejectionReason",
    "connectsReserved" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "expiresSoonNotifiedAt" TIMESTAMPTZ(3),
    "decidedAt" TIMESTAMPTZ(3),

    CONSTRAINT "rental_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_messages" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "body" VARCHAR(2000) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rental_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "body" VARCHAR(500) NOT NULL,
    "targetUrl" VARCHAR(500) NOT NULL,
    "readAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_ledger_entries" (
    "id" UUID NOT NULL,
    "walletId" UUID NOT NULL,
    "requestId" UUID,
    "availableChange" INTEGER NOT NULL,
    "reservedChange" INTEGER NOT NULL,
    "reason" "WalletEntryReason" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenant_profiles_userId_key" ON "tenant_profiles"("userId");
CREATE INDEX "properties_status_updatedAt_idx" ON "properties"("status", "updatedAt");
CREATE INDEX "properties_ownerId_status_idx" ON "properties"("ownerId", "status");
CREATE UNIQUE INDEX "connect_wallets_userId_key" ON "connect_wallets"("userId");
CREATE INDEX "rental_requests_tenantId_createdAt_idx" ON "rental_requests"("tenantId", "createdAt");
CREATE INDEX "rental_requests_ownerId_status_expiresAt_idx" ON "rental_requests"("ownerId", "status", "expiresAt");
CREATE INDEX "rental_requests_propertyId_status_idx" ON "rental_requests"("propertyId", "status");
CREATE INDEX "rental_messages_requestId_createdAt_idx" ON "rental_messages"("requestId", "createdAt");
CREATE INDEX "notifications_userId_readAt_createdAt_idx" ON "notifications"("userId", "readAt", "createdAt");
CREATE INDEX "wallet_ledger_entries_walletId_createdAt_idx" ON "wallet_ledger_entries"("walletId", "createdAt");
CREATE INDEX "wallet_ledger_entries_requestId_idx" ON "wallet_ledger_entries"("requestId");

-- AddForeignKey
ALTER TABLE "tenant_profiles" ADD CONSTRAINT "tenant_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "properties" ADD CONSTRAINT "properties_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "connect_wallets" ADD CONSTRAINT "connect_wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rental_requests" ADD CONSTRAINT "rental_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rental_requests" ADD CONSTRAINT "rental_requests_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rental_requests" ADD CONSTRAINT "rental_requests_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rental_messages" ADD CONSTRAINT "rental_messages_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "rental_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rental_messages" ADD CONSTRAINT "rental_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wallet_ledger_entries" ADD CONSTRAINT "wallet_ledger_entries_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "connect_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wallet_ledger_entries" ADD CONSTRAINT "wallet_ledger_entries_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "rental_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;