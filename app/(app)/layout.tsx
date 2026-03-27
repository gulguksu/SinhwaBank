import type { ReactNode } from "react";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();

  let headerTitle = "최신국 나만의 통장";
  if (user) {
    if (user.role === "admin") {
      headerTitle = "최신국 통장 관리";
    } else {
      const jobSuffix = user.job ? `(${user.job})` : "";
      headerTitle = `최신국 ${user.name}님의 통장${jobSuffix}`;
    }
  }

  return (
    <>
      <header className="app-header">
        <Link href="/" className="logo-main">
          {headerTitle}
        </Link>
        {user && (
          <div className="user-info">
            <span className="user-name">
              {user.role === "admin" ? "관리자" : user.name}님
            </span>
            <form action="/logout" method="post">
              <button type="submit" className="btn-secondary">
                로그아웃
              </button>
            </form>
          </div>
        )}
      </header>
      <main className="container">{children}</main>
      <footer className="app-footer">
        <small>가상 통장 프로그램 · 신화초 5학년 1반</small>
      </footer>
    </>
  );
}

