import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "최신국 나만의 통장",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

