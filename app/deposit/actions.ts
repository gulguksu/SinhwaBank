"use server";

import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserBalance } from "@/lib/balance";

function calcMaturityAmount(principal: number, interestRate: number): number {
  return Math.floor(principal * (1 + interestRate / 100));
}

export async function ensureDefaultDepositProducts() {
  const defaults = [
    {
      name: "1주 5% 예금",
      interestRate: 5,
      maturityWeeks: 1,
      order: 1,
    },
    {
      name: "2주 15% 예금",
      interestRate: 15,
      maturityWeeks: 2,
      order: 2,
    },
    {
      name: "4주 40% 예금",
      interestRate: 40,
      maturityWeeks: 4,
      order: 3,
    },
    {
      name: "30초 10% 예금 (테스트용)",
      interestRate: 10,
      maturityWeeks: 0,
      order: 4,
    },
  ] as const;

  for (const def of defaults) {
    const exists = await prisma.depositProduct.findFirst({
      where: { name: def.name },
    });
    if (!exists) {
      await prisma.depositProduct.create({
        data: {
          name: def.name,
          interestRate: def.interestRate,
          maturityWeeks: def.maturityWeeks,
          order: def.order,
        },
      });
    }
  }
}

export async function addDepositProduct(formData: FormData) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") redirect("/");

  const name = (formData.get("name") ?? "").toString().trim();
  const rateStr = (formData.get("interestRate") ?? "").toString().trim();
  const weeksStr = (formData.get("maturityWeeks") ?? "").toString().trim();

  const interestRate = parseInt(rateStr, 10);
  const maturityWeeks = parseInt(weeksStr, 10);

  if (!name || isNaN(interestRate) || isNaN(maturityWeeks) || maturityWeeks < 0) {
    redirect("/admin/deposit");
  }

  const maxOrder = await prisma.depositProduct.aggregate({
    _max: { order: true },
  });

  await prisma.depositProduct.create({
    data: {
      name,
      interestRate,
      maturityWeeks,
      order: (maxOrder._max.order ?? 0) + 1,
    },
  });

  redirect("/admin/deposit");
}

export async function editDepositProduct(productId: number, formData: FormData) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") redirect("/");

  const name = (formData.get("name") ?? "").toString().trim();
  const rateStr = (formData.get("interestRate") ?? "").toString().trim();
  const weeksStr = (formData.get("maturityWeeks") ?? "").toString().trim();
  const activeStr = (formData.get("isActive") ?? "").toString().trim();

  const interestRate = parseInt(rateStr, 10);
  const maturityWeeks = parseInt(weeksStr, 10);
  const isActive = activeStr === "on" || activeStr === "true";

  if (!name || isNaN(interestRate) || isNaN(maturityWeeks) || maturityWeeks < 0) {
    redirect("/admin/deposit");
  }

  await prisma.depositProduct.update({
    where: { id: productId },
    data: {
      name,
      interestRate,
      maturityWeeks,
      isActive,
    },
  });

  redirect("/admin/deposit");
}

export async function deleteDepositProduct(productId: number) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") redirect("/");

  const subscriptionCount = await prisma.depositSubscription.count({
    where: { productId },
  });

  if (subscriptionCount > 0) {
    await prisma.depositProduct.update({
      where: { id: productId },
      data: { isActive: false },
    });
  } else {
    await prisma.depositProduct.delete({
      where: { id: productId },
    });
  }

  redirect("/admin/deposit");
}

export async function subscribeDeposit(formData: FormData) {
  const user = await getSessionUser();
  if (!user || user.role !== "user") redirect("/");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) redirect("/");

  const productIdStr = (formData.get("productId") ?? "").toString();
  const amountStr = (formData.get("amount") ?? "").toString().trim();
  const productId = parseInt(productIdStr, 10);
  const principal = parseInt(amountStr, 10);

  if (isNaN(productId) || productId <= 0 || isNaN(principal) || principal < 50) {
    redirect("/deposit");
  }

  const product = await prisma.depositProduct.findUnique({
    where: { id: productId },
  });
  if (!product || !product.isActive) {
    redirect("/deposit");
  }

  const existing = await prisma.depositSubscription.findFirst({
    where: {
      userId: dbUser.id,
      productId: product.id,
      status: "ongoing",
    },
  });
  if (existing) {
    redirect("/deposit");
  }

  // 통장 잔액 확인
  const balance = await getUserBalance(dbUser.id);
  if (principal > balance) {
    redirect("/deposit");
  }

  const productIndex =
    product.maturityWeeks === 1
      ? 1
      : product.maturityWeeks === 2
      ? 2
      : product.maturityWeeks === 4
      ? 3
      : product.maturityWeeks === 0 && product.interestRate === 10
      ? 4
      : 0;

  await prisma.$transaction([
    prisma.depositSubscription.create({
      data: {
        userId: dbUser.id,
        productId: product.id,
        principal,
        interestRate: product.interestRate,
        maturityWeeks: product.maturityWeeks,
      },
    }),
    prisma.transaction.create({
      data: {
        userId: dbUser.id,
        type: "withdraw",
        amount: principal,
        description:
          productIndex > 0
            ? `${productIndex}번 예금상품 가입`
            : "예금상품 가입",
      },
    }),
  ]);

  redirect("/deposit");
}

export async function requestEarlyCancel(subscriptionId: number) {
  const user = await getSessionUser();
  if (!user || user.role !== "user") redirect("/");

  const sub = await prisma.depositSubscription.findUnique({
    where: { id: subscriptionId },
    include: { user: true },
  });
  if (!sub || sub.userId !== user.id || sub.status !== "ongoing") {
    redirect("/deposit");
  }

  const banker = await prisma.user.findFirst({
    where: { job: "은행원", isAdmin: false },
  });

  await prisma.depositPayoutRequest.create({
    data: {
      bankerId: banker ? banker.id : null,
      subscriptionId: sub.id,
      amount: sub.principal,
      kind: "early_cancel",
    },
  });

  await prisma.depositSubscription.update({
    where: { id: sub.id },
    data: { status: "waiting_payout" },
  });

  redirect("/deposit");
}

export async function requestMaturityPayout(subscriptionId: number) {
  const user = await getSessionUser();
  if (!user || user.role !== "user") redirect("/");

  const sub = await prisma.depositSubscription.findUnique({
    where: { id: subscriptionId },
    include: { user: true, product: true },
  });
  if (!sub || sub.userId !== user.id || sub.status !== "ongoing") {
    redirect("/deposit");
  }

  const now = new Date();
  const maturityDate = new Date(sub.startedAt);
  if (sub.maturityWeeks > 0) {
    maturityDate.setDate(maturityDate.getDate() + sub.maturityWeeks * 7);
  } else if (sub.product?.name && sub.product.name.includes("30초")) {
    maturityDate.setSeconds(maturityDate.getSeconds() + 30);
  }
  if (now < maturityDate) {
    redirect("/deposit");
  }

  const banker = await prisma.user.findFirst({
    where: { job: "은행원", isAdmin: false },
  });

  const amount = calcMaturityAmount(sub.principal, sub.interestRate);

  await prisma.depositPayoutRequest.create({
    data: {
      bankerId: banker ? banker.id : null,
      subscriptionId: sub.id,
      amount,
      kind: "maturity",
    },
  });

  await prisma.depositSubscription.update({
    where: { id: sub.id },
    data: { status: "waiting_payout" },
  });

  redirect("/deposit");
}

