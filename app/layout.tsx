import "./globals.css";
import type { ReactNode } from "react";
import { getSessionUser } from "@/lib/auth";

export const metadata = {
  title: "신화초 5학년 1반 통장",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getSessionUser();

  return (
    <html lang="ko">
      <body>
        <header className="app-header">
          <div className="logo-main">신화초 5학년 1반 통장</div>
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
      </body>
    </html>
  );
}

