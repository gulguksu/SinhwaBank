import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { setGlobalTaxAction } from "./setGlobalTaxAction";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/");
  }

  const globalState =
    (await prisma.globalState.findUnique({ where: { id: 1 } })) ??
    (await prisma.globalState.create({ data: { id: 1, globalTax: 0 } }));

  if (user.role === "admin") {
    const users = await prisma.user.findMany({
      orderBy: { id: "asc" },
    });

    const withBalances = await Promise.all(
      users.map(async (u) => {
        const txs = await prisma.transaction.findMany({
          where: { userId: u.id },
        });
        const balance = txs.reduce((acc, t) => {
          return acc + (t.type === "deposit" ? t.amount : -t.amount);
        }, 0);
        return { ...u, balance };
      })
    );

    return (
      <section className="grid-two">
        <div className="card">
          <h2 className="section-title">우리 나라 세금 (관리자)</h2>
          <p className="amount">
            {globalState.globalTax.toLocaleString("ko-KR")}원
          </p>
          <p className="section-desc">
            모든 학생이 함께 보는 금액입니다. 여기에서 금액을 변경하면 모든
            학생에게 동시에 적용됩니다.
          </p>
          <form action={setGlobalTaxAction} className="form-inline">
            <label className="form-label-inline">
              금액
              <input
                type="number"
                name="globalTax"
                min={0}
                defaultValue={globalState.globalTax}
                required
              />
            </label>
            <button type="submit" className="btn-primary">
              금액 변경
            </button>
          </form>
        </div>

        <div className="card">
          <h2 className="section-title">학생 통장 관리</h2>
          <p className="section-desc">
            각 학생의 이름을 눌러 해당 학생의 통장 잔액과 거래내역을
            추가/삭제/수정할 수 있습니다.
          </p>
          {withBalances.length === 0 ? (
            <p>아직 가입한 학생이 없습니다.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>아이디</th>
                  <th>통장 잔액</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {withBalances.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.username}</td>
                    <td>{u.balance.toLocaleString("ko-KR")}원</td>
                    <td>
                      <Link
                        href={`/admin/users/${u.username}`}
                        className="btn-secondary btn-small"
                      >
                        거래내역 관리
                      </Link>
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

  // 일반 사용자
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) {
    redirect("/");
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
        <h2 className="section-title">우리 나라 세금</h2>
        <p className="amount">
          {globalState.globalTax.toLocaleString("ko-KR")}원
        </p>
        <p className="section-desc">
          우리 반 학생들이 함께 공유하는 가상의 세금 금액입니다. 관리자가
          금액을 조정하면 모든 학생에게 똑같이 보입니다.
        </p>
      </div>
      <div className="card">
        <h2 className="section-title">내 통장 잔액</h2>
        <p className="amount">{balance.toLocaleString("ko-KR")}원</p>
        <p className="section-desc">
          나에게만 해당되는 가상의 통장 잔액입니다. 입금/출금 내역은 관리자만
          수정할 수 있습니다.
        </p>
        <Link href="/transactions" className="btn-primary">
          거래내역 보기
        </Link>
      </div>
    </section>
  );
}

