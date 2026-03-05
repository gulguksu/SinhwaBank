-- CreateTable
CREATE TABLE "TaxHistory" (
    "id" SERIAL NOT NULL,
    "amountBefore" INTEGER NOT NULL,
    "amountAfter" INTEGER NOT NULL,
    "diff" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxHistory_pkey" PRIMARY KEY ("id")
);
