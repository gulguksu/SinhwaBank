import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function TaxHistoryPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/");
  }

  const histories = await prisma.taxHistory.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <section className="card">
      <h2 className="section-title">우리 나라 세금 내역</h2>
      <p className="section-desc">
        관리자가 우리 나라 세금 금액을 어떻게 변경했는지 시간 순서대로 보여
        줍니다.
      </p>
      {histories.length === 0 ? (
        <p>아직 세금 변경 내역이 없습니다.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>일시</th>
              <th>변경 전</th>
              <th>변경 후</th>
              <th>변화량</th>
              <th>내역</th>
            </tr>
          </thead>
          <tbody>
            {histories.map((h) => (
              <tr key={h.id}>
                <td>
                  {h.createdAt.toLocaleString("ko-KR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </td>
                <td>{h.amountBefore.toLocaleString("ko-KR")}피스</td>
                <td>{h.amountAfter.toLocaleString("ko-KR")}피스</td>
                <td>
                  {h.diff >= 0 ? "+" : "-"}
                  {Math.abs(h.diff).toLocaleString("ko-KR")}피스
                </td>
                <td>{h.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Link href="/dashboard" className="btn-secondary">
        뒤로 가기
      </Link>
    </section>
  );
}

