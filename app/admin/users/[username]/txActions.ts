"use server";

import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { JOB_OPTIONS, isValidJob } from "@/lib/constants";

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

/** 해당 학생 계정 탈퇴 처리. 삭제 후 동일 아이디/비밀번호/이름으로 재가입 가능하며, 잔액은 0원부터 시작 */
export async function withdrawUserAction(username: string) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    redirect("/");
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    redirect("/dashboard");
  }

  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });

  redirect("/dashboard");
}

/** 해당 학생에게 직업 부여/변경 */
export async function updateJobAction(username: string, formData: FormData) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    redirect("/");
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    redirect("/dashboard");
  }

  const jobRaw = formData.get("job");
  const job =
    jobRaw === "" || jobRaw === null || jobRaw === undefined
      ? null
      : String(jobRaw).trim();

  if (job !== null && !isValidJob(job)) {
    redirect(`/admin/users/${username}`);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { job: job || null },
  });

  redirect(`/admin/users/${username}`);
}

