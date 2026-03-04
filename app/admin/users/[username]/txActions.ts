"use server";

import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function addTransactionAction(userId: number, formData: FormData) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    redirect("/");
  }

  const type = (formData.get("type") || "deposit").toString();
  const amountStr = (formData.get("amount") || "0").toString();
  const description = (formData.get("description") || "").toString().trim();

  const amount = parseInt(amountStr, 10);

  if (!["deposit", "withdraw"].includes(type) || isNaN(amount) || amount <= 0) {
    const u = await prisma.user.findUnique({ where: { id: userId } });
    redirect(`/admin/users/${u?.username}`);
  }

  await prisma.transaction.create({
    data: {
      userId,
      type,
      amount,
      description,
    },
  });

  const u = await prisma.user.findUnique({ where: { id: userId } });
  redirect(`/admin/users/${u?.username}`);
}

export async function deleteTransactionAction(txId: number) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    redirect("/");
  }

  const tx = await prisma.transaction.findUnique({ where: { id: txId } });
  if (!tx) {
    redirect("/dashboard");
  }

  const u = await prisma.user.findUnique({ where: { id: tx.userId } });
  await prisma.transaction.delete({ where: { id: txId } });

  redirect(`/admin/users/${u?.username}`);
}

export async function editTransactionAction(txId: number, formData: FormData) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    redirect("/");
  }

  const tx = await prisma.transaction.findUnique({ where: { id: txId } });
  if (!tx) {
    redirect("/dashboard");
  }

  const type = (formData.get("type") || "deposit").toString();
  const amountStr = (formData.get("amount") || "0").toString();
  const description = (formData.get("description") || "").toString().trim();

  const amount = parseInt(amountStr, 10);
  if (!["deposit", "withdraw"].includes(type) || isNaN(amount) || amount <= 0) {
    const u = await prisma.user.findUnique({ where: { id: tx.userId } });
    redirect(`/admin/users/${u?.username}`);
  }

  await prisma.transaction.update({
    where: { id: txId },
    data: {
      type,
      amount,
      description,
    },
  });

  const u = await prisma.user.findUnique({ where: { id: tx.userId } });
  redirect(`/admin/users/${u?.username}`);
}

