-- Foreign-key and hot-path query indexes
CREATE INDEX IF NOT EXISTS "BankPaymentRequest_requestedById_idx"
ON "BankPaymentRequest" ("requestedById");

CREATE INDEX IF NOT EXISTS "BankPaymentRequest_targetUserId_idx"
ON "BankPaymentRequest" ("targetUserId");

CREATE INDEX IF NOT EXISTS "DepositPayoutRequest_bankerId_idx"
ON "DepositPayoutRequest" ("bankerId");

CREATE INDEX IF NOT EXISTS "DepositPayoutRequest_subscriptionId_idx"
ON "DepositPayoutRequest" ("subscriptionId");

CREATE INDEX IF NOT EXISTS "DepositSubscription_productId_idx"
ON "DepositSubscription" ("productId");

CREATE INDEX IF NOT EXISTS "DepositSubscription_userId_idx"
ON "DepositSubscription" ("userId");

CREATE INDEX IF NOT EXISTS "PoliceFineRequest_requestedById_idx"
ON "PoliceFineRequest" ("requestedById");

CREATE INDEX IF NOT EXISTS "PoliceFineRequest_targetUserId_idx"
ON "PoliceFineRequest" ("targetUserId");

CREATE INDEX IF NOT EXISTS "TaxChangeRequest_requestedById_idx"
ON "TaxChangeRequest" ("requestedById");

CREATE INDEX IF NOT EXISTS "Transaction_userId_idx"
ON "Transaction" ("userId");

-- Additional composite indexes for frequent filters/sorts
CREATE INDEX IF NOT EXISTS "Transaction_userId_createdAt_idx"
ON "Transaction" ("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "Transaction_userId_type_idx"
ON "Transaction" ("userId", "type");

CREATE INDEX IF NOT EXISTS "TaxChangeRequest_status_createdAt_idx"
ON "TaxChangeRequest" ("status", "createdAt");

CREATE INDEX IF NOT EXISTS "BankPaymentRequest_status_createdAt_idx"
ON "BankPaymentRequest" ("status", "createdAt");

CREATE INDEX IF NOT EXISTS "PoliceFineRequest_status_createdAt_idx"
ON "PoliceFineRequest" ("status", "createdAt");

CREATE INDEX IF NOT EXISTS "DepositSubscription_userId_status_startedAt_idx"
ON "DepositSubscription" ("userId", "status", "startedAt");

CREATE INDEX IF NOT EXISTS "DepositPayoutRequest_status_createdAt_idx"
ON "DepositPayoutRequest" ("status", "createdAt");
