"use server";

import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function setGlobalTaxAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    redirect("/");
  }

  const valueStr = (formData.get("globalTax") || "0").toString().trim();
  const description = (formData.get("description") || "").toString().trim();
  const value = parseInt(valueStr, 10);
  if (isNaN(value) || value < 0) {
    redirect("/dashboard");
  }

  const existing = await prisma.globalState.findUnique({ where: { id: 1 } });
  const before = existing?.globalTax ?? 0;

  await prisma.globalState.upsert({
    where: { id: 1 },
    update: { globalTax: value },
    create: { id: 1, globalTax: value },
  });

  const diff = value - before;

  await prisma.taxHistory.create({
    data: {
      amountBefore: before,
      amountAfter: value,
      diff,
      description: description || "세금 금액 변경",
    },
  });

  redirect("/dashboard");
}

