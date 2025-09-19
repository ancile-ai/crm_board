/*
  Warnings:

  - You are about to drop the column `samGovLink` on the `Opportunity` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Opportunity" DROP COLUMN "samGovLink",
ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "opportunityUrl" TEXT,
ADD COLUMN     "samGovId" TEXT;

-- CreateTable
CREATE TABLE "public"."Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'USA',
    "cageCode" TEXT,
    "duns" TEXT,
    "samRegistered" BOOLEAN NOT NULL DEFAULT false,
    "smallBusiness" BOOLEAN NOT NULL DEFAULT false,
    "womanOwned" BOOLEAN NOT NULL DEFAULT false,
    "veteranOwned" BOOLEAN NOT NULL DEFAULT false,
    "hubzone" BOOLEAN NOT NULL DEFAULT false,
    "eightA" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Contact" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "title" TEXT,
    "companyId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_ContactOpportunities" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ContactOpportunities_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ContactOpportunities_B_index" ON "public"."_ContactOpportunities"("B");

-- AddForeignKey
ALTER TABLE "public"."Opportunity" ADD CONSTRAINT "Opportunity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contact" ADD CONSTRAINT "Contact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ContactOpportunities" ADD CONSTRAINT "_ContactOpportunities_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ContactOpportunities" ADD CONSTRAINT "_ContactOpportunities_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
