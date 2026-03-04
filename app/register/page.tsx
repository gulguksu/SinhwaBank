import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const USERNAME_REGEX = /^[a-z0-9]+$/;

async function registerAction(formData: FormData) {
  "use server";

  const username = (formData.get("username") || "").toString().trim();
  const password = (formData.get("password") || "").toString().trim();
  const name = (formData.get("name") || "").toString().trim();

  if (!username || !password || !name) {
    redirect("/register");
  }

  if (!USERNAME_REGEX.test(username) || !USERNAME_REGEX.test(password)) {
    redirect("/register");
  }

  if (username === "admin") {
    redirect("/register");
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    redirect("/register");
  }

  const hash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { username, passwordHash: hash, name },
  });

  redirect("/");
}

export default function RegisterPage() {
  return (
    <section className="auth-wrapper">
      <div className="auth-card">
        <h2 className="section-title">회원가입</h2>
        <form action={registerAction} className="form">
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
          <label className="form-label">
            이름
            <input name="name" required />
          </label>
          <button type="submit" className="btn-primary">
            가입하기
          </button>
        </form>
      </div>
    </section>
  );
}

