import type { ReactNode } from "react";
import Link from "next/link";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="app-header">
        <Link href="/" className="logo-main">
          최신국 나만의 통장
        </Link>
      </header>
      <main className="container">{children}</main>
      <footer className="app-footer">
        <small>가상 통장 프로그램 · 신화초 5학년 1반</small>
      </footer>
    </>
  );
}

