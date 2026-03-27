"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function setGlobalTaxAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    redirect("/");
  }

  const globalTaxStr = (formData.get("globalTax") ?? "").toString();
  const description = (formData.get("description") ?? "").toString().trim();
  const globalTax = parseInt(globalTaxStr, 10);

  if (isNaN(globalTax) || globalTax < 0) {
    redirect("/dashboard");
  }

  const before =
    (await prisma.globalState.findUnique({ where: { id: 1 } }))?.globalTax ?? 0;

  await prisma.$transaction([
    prisma.globalState.upsert({
      where: { id: 1 },
      update: { globalTax },
      create: { id: 1, globalTax },
    }),
    prisma.taxHistory.create({
      data: {
        amountBefore: before,
        amountAfter: globalTax,
        diff: globalTax - before,
        description: description || "세금 변경",
      },
    }),
  ]);

  revalidatePath("/dashboard");
  revalidatePath("/tax-history");
  redirect("/dashboard");
}

