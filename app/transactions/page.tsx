import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function TransactionsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/");
  }
  if (user.role === "admin") {
    redirect("/dashboard");
  }

  const txs = await prisma.transaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
  const balance = txs.reduce((acc, t) => {
    return acc + (t.type === "deposit" ? t.amount : -t.amount);
  }, 0);

  return (
    <section className="card">
      <h2 className="section-title">내 거래내역</h2>
      <p className="section-desc">
        입금/출금 내역은 관리자 선생님만 수정할 수 있습니다. 궁금한 점이 있으면
        선생님께 질문해 보세요.
      </p>

      <div className="balance-box">
        <span>현재 잔액</span>
        <strong>{balance.toLocaleString("ko-KR")}피스</strong>
      </div>

      {txs.length === 0 ? (
        <p>아직 거래내역이 없습니다.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>구분</th>
              <th>금액</th>
              <th>내용</th>
            </tr>
          </thead>
          <tbody>
            {txs.map((t) => (
              <tr key={t.id}>
                <td>{t.type === "deposit" ? "입금" : "출금"}</td>
                <td className="text-right">
                  {t.type === "deposit" ? "+" : "-"}
                  {t.amount.toLocaleString("ko-KR")}피스
                </td>
                <td>{t.description}</td>
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

