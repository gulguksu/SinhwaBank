"use server";

import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { JOB_TO_SLUG, BANK_PAYMENT_DESCRIPTIONS } from "@/lib/constants";

/** 국세청장: 세금 증감(더하기/빼기)으로 조정 요청 제출 */
export async function submitTaxChangeByDeltaRequest(formData: FormData) {
  const user = await getSessionUser();
  if (!user || user.role !== "user") redirect("/");
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.job !== "국세청장") redirect("/dashboard");

  const mode = (formData.get("mode") ?? "").toString();
  const amountStr = (formData.get("amount") ?? "").toString().trim();
  const description = (formData.get("description") ?? "").toString().trim();
  const amount = parseInt(amountStr, 10);

  if (!["plus", "minus"].includes(mode) || isNaN(amount) || amount <= 0 || !description) {
    redirect("/job/tax-commissioner");
  }

  const globalState =
    (await prisma.globalState.findUnique({ where: { id: 1 } })) ??
    (await prisma.globalState.create({ data: { id: 1, globalTax: 0 } }));
  const currentTax = globalState.globalTax;
  const newAmount =
    mode === "plus"
      ? currentTax + amount
      : Math.max(0, currentTax - amount);

  await prisma.taxChangeRequest.create({
    data: {
      requestedById: user.id,
      newAmount,
      description,
      status: "pending",
    },
  });
  redirect("/job/tax-commissioner");
}

/** 은행원: 통장 지급 요청 제출 */
export async function submitBankPaymentRequest(formData: FormData) {
  const user = await getSessionUser();
  if (!user || user.role !== "user") redirect("/");
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.job !== "은행원") redirect("/dashboard");

  const targetUserIdStr = (formData.get("targetUserId") ?? "").toString();
  const amountStr = (formData.get("amount") ?? "").toString().trim();
  const description = (formData.get("description") ?? "").toString().trim();
  const targetUserId = parseInt(targetUserIdStr, 10);
  const amount = parseInt(amountStr, 10);

  const validDescriptions = [...BANK_PAYMENT_DESCRIPTIONS];
  if (
    isNaN(targetUserId) ||
    targetUserId <= 0 ||
    isNaN(amount) ||
    amount <= 0 ||
    !validDescriptions.includes(description as (typeof BANK_PAYMENT_DESCRIPTIONS)[number])
  ) {
    redirect("/job/banker");
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target || target.isAdmin) redirect("/job/banker");

  await prisma.bankPaymentRequest.create({
    data: {
      requestedById: user.id,
      targetUserId,
      amount,
      description,
      status: "pending",
    },
  });
  redirect("/job/banker");
}

/** 경찰서장: 벌금 징수 요청 제출 */
export async function submitPoliceFineRequest(formData: FormData) {
  const user = await getSessionUser();
  if (!user || user.role !== "user") redirect("/");
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.job !== "경찰서장") redirect("/dashboard");

  const targetUserIdStr = (formData.get("targetUserId") ?? "").toString();
  const amountStr = (formData.get("amount") ?? "").toString().trim();
  const violationDetail = (formData.get("violationDetail") ?? "").toString().trim();
  const targetUserId = parseInt(targetUserIdStr, 10);
  const amount = parseInt(amountStr, 10);

  if (isNaN(targetUserId) || targetUserId <= 0 || isNaN(amount) || amount <= 0 || !violationDetail) {
    redirect("/job/police");
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target || target.isAdmin) redirect("/job/police");

  await prisma.policeFineRequest.create({
    data: {
      requestedById: user.id,
      targetUserId,
      amount,
      violationDetail,
      status: "pending",
    },
  });
  redirect("/job/police");
}

/** 국세청장: 세금 조정 요청 취소 (대기 중일 때만) */
export async function cancelTaxChangeRequest(requestId: number) {
  const user = await getSessionUser();
  if (!user || user.role !== "user") redirect("/");
  const req = await prisma.taxChangeRequest.findUnique({ where: { id: requestId } });
  if (!req || req.requestedById !== user.id || req.status !== "pending") {
    redirect("/job/tax-commissioner");
  }
  await prisma.taxChangeRequest.update({
    where: { id: requestId },
    data: { status: "cancelled" },
  });
  redirect("/job/tax-commissioner");
}

/** 은행원: 지급 요청 취소 (대기 중일 때만) */
export async function cancelBankPaymentRequest(requestId: number) {
  const user = await getSessionUser();
  if (!user || user.role !== "user") redirect("/");
  const req = await prisma.bankPaymentRequest.findUnique({ where: { id: requestId } });
  if (!req || req.requestedById !== user.id || req.status !== "pending") {
    redirect("/job/banker");
  }
  await prisma.bankPaymentRequest.update({
    where: { id: requestId },
    data: { status: "cancelled" },
  });
  redirect("/job/banker");
}

/** 경찰서장: 벌금 요청 취소 (대기 중일 때만) */
export async function cancelPoliceFineRequest(requestId: number) {
  const user = await getSessionUser();
  if (!user || user.role !== "user") redirect("/");
  const req = await prisma.policeFineRequest.findUnique({ where: { id: requestId } });
  if (!req || req.requestedById !== user.id || req.status !== "pending") {
    redirect("/job/police");
  }
  await prisma.policeFineRequest.update({
    where: { id: requestId },
    data: { status: "cancelled" },
  });
  redirect("/job/police");
}

/** 국세청장: 취소된 요청 삭제 */
export async function deleteTaxChangeRequest(requestId: number) {
  const user = await getSessionUser();
  if (!user || user.role !== "user") redirect("/");
  const req = await prisma.taxChangeRequest.findUnique({ where: { id: requestId } });
  if (!req || req.requestedById !== user.id || req.status !== "cancelled") {
    redirect("/job/tax-commissioner");
  }
  await prisma.taxChangeRequest.delete({ where: { id: requestId } });
  redirect("/job/tax-commissioner");
}

/** 은행원: 취소된 요청 삭제 */
export async function deleteBankPaymentRequest(requestId: number) {
  const user = await getSessionUser();
  if (!user || user.role !== "user") redirect("/");
  const req = await prisma.bankPaymentRequest.findUnique({ where: { id: requestId } });
  if (!req || req.requestedById !== user.id || req.status !== "cancelled") {
    redirect("/job/banker");
  }
  await prisma.bankPaymentRequest.delete({ where: { id: requestId } });
  redirect("/job/banker");
}

/** 경찰서장: 취소된 요청 삭제 */
export async function deletePoliceFineRequest(requestId: number) {
  const user = await getSessionUser();
  if (!user || user.role !== "user") redirect("/");
  const req = await prisma.policeFineRequest.findUnique({ where: { id: requestId } });
  if (!req || req.requestedById !== user.id || req.status !== "cancelled") {
    redirect("/job/police");
  }
  await prisma.policeFineRequest.delete({ where: { id: requestId } });
  redirect("/job/police");
}
