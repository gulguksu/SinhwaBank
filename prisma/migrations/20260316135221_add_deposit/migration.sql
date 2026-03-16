-- CreateTable
CREATE TABLE "DepositProduct" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "interestRate" INTEGER NOT NULL,
    "maturityWeeks" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DepositProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositSubscription" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "principal" INTEGER NOT NULL,
    "interestRate" INTEGER NOT NULL,
    "maturityWeeks" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ongoing',

    CONSTRAINT "DepositSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositPayoutRequest" (
    "id" SERIAL NOT NULL,
    "bankerId" INTEGER,
    "subscriptionId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DepositPayoutRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DepositSubscription" ADD CONSTRAINT "DepositSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositSubscription" ADD CONSTRAINT "DepositSubscription_productId_fkey" FOREIGN KEY ("productId") REFERENCES "DepositProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositPayoutRequest" ADD CONSTRAINT "DepositPayoutRequest_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "DepositSubscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositPayoutRequest" ADD CONSTRAINT "DepositPayoutRequest_bankerId_fkey" FOREIGN KEY ("bankerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
