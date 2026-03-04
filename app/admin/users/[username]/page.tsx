import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  addTransactionAction,
  deleteTransactionAction,
  editTransactionAction,
} from "./txActions";

export default async function AdminUserPage({
  params,
}: {
  params: { username: string };
}) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    redirect("/");
  }

  const dbUser = await prisma.user.findUnique({
    where: { username: params.username },
  });
  if (!dbUser) {
    redirect("/dashboard");
  }

  const txs = await prisma.transaction.findMany({
    where: { userId: dbUser.id },
    orderBy: { createdAt: "asc" },
  });
  const balance = txs.reduce((acc, t) => {
    return acc + (t.type === "deposit" ? t.amount : -t.amount);
  }, 0);

  return (
    <section className="grid-two">
      <div className="card">
        <h2 className="section-title">학생 정보</h2>
        <ul className="info-list">
          <li>
            <strong>이름</strong> {dbUser.name}
          </li>
          <li>
            <strong>아이디</strong> {dbUser.username}
          </li>
          <li>
            <strong>현재 잔액</strong> {balance.toLocaleString("ko-KR")}원
          </li>
        </ul>

        <form
          action={addTransactionAction.bind(null, dbUser.id)}
          className="form"
        >
          <h3 className="sub-title">거래내역 추가</h3>
          <label className="form-label">
            구분
            <select name="type" required>
              <option value="deposit">입금</option>
              <option value="withdraw">출금</option>
            </select>
          </label>
          <label className="form-label">
            금액
            <input type="number" name="amount" min={1} required />
          </label>
          <label className="form-label">
            내용
            <input
              type="text"
              name="description"
              placeholder="예: 상점 쿠폰, 벌금, 특별 활동 등"
            />
          </label>
          <button type="submit" className="btn-primary">
            추가하기
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="section-title">거래내역 목록 (관리자)</h2>
        {txs.length === 0 ? (
          <p>아직 거래내역이 없습니다. 위에서 새로운 거래를 추가해 보세요.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>구분</th>
                <th>금액</th>
                <th>내용</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {txs.map((t) => (
                <tr key={t.id}>
                  <td>{t.type === "deposit" ? "입금" : "출금"}</td>
                  <td className="text-right">
                    {t.type === "deposit" ? "+" : "-"}
                    {t.amount.toLocaleString("ko-KR")}원
                  </td>
                  <td>{t.description}</td>
                  <td>
                    <form
                      action={deleteTransactionAction.bind(null, t.id)}
                      className="inline-form"
                    >
                      <button
                        type="submit"
                        className="btn-danger btn-small"
                      >
                        삭제
                      </button>
                    </form>
                    <form
                      action={editTransactionAction.bind(null, t.id)}
                      className="inline-form edit-inline-form"
                    >
                      <select name="type" defaultValue={t.type}>
                        <option value="deposit">입금</option>
                        <option value="withdraw">출금</option>
                      </select>
                      <input
                        type="number"
                        name="amount"
                        min={1}
                        defaultValue={t.amount}
                        required
                      />
                      <input
                        type="text"
                        name="description"
                        defaultValue={t.description}
                        placeholder="내용"
                      />
                      <button type="submit" className="btn-secondary btn-small">
                        수정
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

