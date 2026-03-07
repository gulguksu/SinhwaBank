import Link from "next/link";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { getSessionUser, setSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const USERNAME_REGEX = /^[a-z0-9]+$/;

async function loginAction(formData: FormData) {
  "use server";

  const username = (formData.get("username") || "").toString().trim();
  const password = (formData.get("password") || "").toString().trim();

  if (username === "admin" && password === "admin") {
    await setSessionUser({ role: "admin", name: "관리자" });
    redirect("/dashboard");
  }

  if (!USERNAME_REGEX.test(username) || !USERNAME_REGEX.test(password)) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    redirect("/");
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    redirect("/");
  }

  await setSessionUser({
    role: "user",
    id: user.id,
    username: user.username,
    name: user.name,
    job: user.job ?? null,
  });

  redirect("/dashboard");
}

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <section className="auth-wrapper">
      <div className="auth-card">
        <h2 className="section-title">로그인</h2>
        <form action={loginAction} className="form">
          <label className="form-label">
            아이디
            <input
              name="username"
              required
              pattern="[a-z0-9]+"
              title="영어 소문자와 숫자만 사용 가능합니다."
            />
          </label>
          <label className="form-label">
            비밀번호
            <input
              type="password"
              name="password"
              required
              pattern="[a-z0-9]+"
              title="영어 소문자와 숫자만 사용 가능합니다."
            />
          </label>
          <button type="submit" className="btn-primary">
            로그인
          </button>
        </form>

        <p className="auth-helper">
          아직 계정이 없다면? <Link href="/register">회원가입</Link>
        </p>
      </div>
    </section>
  );
}

