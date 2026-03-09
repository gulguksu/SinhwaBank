"use server";

import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function approveTaxChangeRequest(requestId: number) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") redirect("/");

  const req = await prisma.taxChangeRequest.findUnique({
    where: { id: requestId },
  });
  if (!req || req.status !== "pending") redirect("/admin/requests");

  const existing = await prisma.globalState.findUnique({ where: { id: 1 } });
  const before = existing?.globalTax ?? 0;

  await prisma.$transaction([
    prisma.globalState.upsert({
      where: { id: 1 },
      update: { globalTax: req.newAmount },
      create: { id: 1, globalTax: req.newAmount },
    }),
    prisma.taxHistory.create({
      data: {
        amountBefore: before,
        amountAfter: req.newAmount,
        diff: req.newAmount - before,
        description: req.description,
      },
    }),
    prisma.taxChangeRequest.update({
      where: { id: requestId },
      data: { status: "approved" },
    }),
  ]);
  redirect("/admin/requests");
}

export async function rejectTaxChangeRequest(requestId: number) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") redirect("/");
  const req = await prisma.taxChangeRequest.findUnique({ where: { id: requestId } });
  if (!req || req.status !== "pending") redirect("/admin/requests");
  await prisma.taxChangeRequest.update({
    where: { id: requestId },
    data: { status: "rejected" },
  });
  redirect("/admin/requests");
}

export async function approveBankPaymentRequest(requestId: number) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") redirect("/");

  const req = await prisma.bankPaymentRequest.findUnique({
    where: { id: requestId },
    include: { target: true },
  });
  if (!req || req.status !== "pending") redirect("/admin/requests");

  await prisma.$transaction([
    prisma.transaction.create({
      data: {
        userId: req.targetUserId,
        type: "deposit",
        amount: req.amount,
        description: req.description,
      },
    }),
    prisma.bankPaymentRequest.update({
      where: { id: requestId },
      data: { status: "approved" },
    }),
  ]);
  redirect("/admin/requests");
}

export async function rejectBankPaymentRequest(requestId: number) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") redirect("/");
  const req = await prisma.bankPaymentRequest.findUnique({ where: { id: requestId } });
  if (!req || req.status !== "pending") redirect("/admin/requests");
  await prisma.bankPaymentRequest.update({
    where: { id: requestId },
    data: { status: "rejected" },
  });
  redirect("/admin/requests");
}

export async function approvePoliceFineRequest(requestId: number) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") redirect("/");

  const req = await prisma.policeFineRequest.findUnique({
    where: { id: requestId },
    include: { target: true },
  });
  if (!req || req.status !== "pending") redirect("/admin/requests");

  const existing = await prisma.globalState.findUnique({ where: { id: 1 } });
  const taxBefore = existing?.globalTax ?? 0;
  const taxAfter = taxBefore + req.amount;
  const taxDescription = `${req.target.name} 벌금`;

  await prisma.$transaction([
    prisma.transaction.create({
      data: {
        userId: req.targetUserId,
        type: "withdraw",
        amount: req.amount,
        description: `${req.violationDetail} 위반 벌금`,
      },
    }),
    prisma.globalState.upsert({
      where: { id: 1 },
      update: { globalTax: taxAfter },
      create: { id: 1, globalTax: taxAfter },
    }),
    prisma.taxHistory.create({
      data: {
        amountBefore: taxBefore,
        amountAfter: taxAfter,
        diff: req.amount,
        description: taxDescription,
      },
    }),
    prisma.policeFineRequest.update({
      where: { id: requestId },
      data: { status: "approved" },
    }),
  ]);
  redirect("/admin/requests");
}

export async function rejectPoliceFineRequest(requestId: number) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") redirect("/");
  const req = await prisma.policeFineRequest.findUnique({ where: { id: requestId } });
  if (!req || req.status !== "pending") redirect("/admin/requests");
  await prisma.policeFineRequest.update({
    where: { id: requestId },
    data: { status: "rejected" },
  });
  redirect("/admin/requests");
}
