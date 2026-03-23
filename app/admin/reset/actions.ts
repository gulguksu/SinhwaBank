"use server";

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

function requireAdmin() {
  return getSessionUser().then((user) => {
    if (!user || user.role !== "admin") redirect("/");
    return user;
  });
}

export async function resetGlobalTaxAction(formData: FormData) {
  await requireAdmin();

  const confirm = formData.get("confirm");
  if (confirm !== "1") redirect("/admin/reset");

  const existing = await prisma.globalState.findUnique({ where: { id: 1 } });
  const before = existing?.globalTax ?? 0;

  // "내역"은 TaxHistory를 의미하며, 초기화 시 모두 제거합니다.
  await prisma.taxHistory.deleteMany({});

  await prisma.globalState.upsert({
    where: { id: 1 },
    update: { globalTax: 0 },
    create: { id: 1, globalTax: 0 },
  });

  // before 값은 현재 요구사항상 별도 처리하지 않습니다.
  void before;
  redirect("/admin/reset");
}

export async function resetDepositAction(formData: FormData) {
  await requireAdmin();

  const confirm = formData.get("confirm");
  if (confirm !== "1") redirect("/admin/reset");

  const subs = await prisma.depositSubscription.findMany({
    select: { id: true },
  });
  const subscriptionIds = subs.map((s) => s.id);

  if (subscriptionIds.length > 0) {
    await prisma.depositPayoutRequest.deleteMany({
      where: { subscriptionId: { in: subscriptionIds } },
    });
  }

  await prisma.depositSubscription.deleteMany({});

  redirect("/admin/reset");
}

export async function resetStudentsAction(formData: FormData) {
  await requireAdmin();

  const rawIds = formData.getAll("studentIds");
  const ids = rawIds
    .map((v) => Number(String(v)))
    .filter((n) => Number.isFinite(n) && n > 0);

  if (ids.length === 0) redirect("/admin/reset");

  await prisma.$transaction([
    prisma.transaction.deleteMany({
      where: { userId: { in: ids } },
    }),
    prisma.user.updateMany({
      where: { id: { in: ids }, isAdmin: false },
      data: { job: null },
    }),
  ]);

  redirect("/admin/reset");
}

