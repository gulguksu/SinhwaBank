"use server";

import { prisma } from "@/lib/db";

export type ForgotPasswordState = {
  hint: string | null;
  error: string | null;
};

export async function getPasswordHint(
  _prev: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const username = (formData.get("username") || "").toString().trim();
  if (!username) {
    return { hint: null, error: "아이디를 입력해 주세요." };
  }
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return { hint: null, error: "해당 아이디의 회원이 없습니다." };
  }
  const hint = user.passwordHint ?? "(등록된 힌트가 없습니다.)";
  return { hint, error: null };
}
