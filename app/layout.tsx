import "./globals.css";
import type { ReactNode } from "react";
import { getSessionUser } from "@/lib/auth";

export const metadata = {
  title: "최신국 나만의 통장",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getSessionUser();

  let headerTitle = "최신국 나만의 통장";
  if (user) {
    if (user.role === "admin") {
      headerTitle = "최신국 통장 관리";
    } else {
      headerTitle = `최신국 ${user.name}님의 통장`;
    }
  }

  return (
    <html lang="ko">
      <body>
        <header className="app-header">
          <div className="logo-main">{headerTitle}</div>
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

