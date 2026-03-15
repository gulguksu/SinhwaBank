import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { setGlobalTaxAction } from "./setGlobalTaxAction";
import { hasJobSpecialPage, JOB_TO_SLUG } from "@/lib/constants";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/");
  }

  const globalState =
    (await prisma.globalState.findUnique({ where: { id: 1 } })) ??
    (await prisma.globalState.create({ data: { id: 1, globalTax: 0 } }));

  if (user.role === "admin") {
    const usersWithTxs = await prisma.user.findMany({
      orderBy: { id: "asc" },
      include: { transactions: true },
    });
    const withBalances = usersWithTxs.map((u) => {
      const balance = u.transactions.reduce((acc, t) => {
        return acc + (t.type === "deposit" ? t.amount : -t.amount);
      }, 0);
      const { transactions: _, ...user } = u;
      return { ...user, balance };
    });

    return (
      <section className="grid-two">
        <div className="card">
          <h2 className="section-title">우리 나라 세금 (관리자)</h2>
          <p className="amount">
            {globalState.globalTax.toLocaleString("ko-KR")}피스
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
            <label className="form-label-inline">
              내역
              <input
                type="text"
                name="description"
                placeholder="예: 세금 인상, 세금 감면 등"
              />
            </label>
            <button type="submit" className="btn-primary">
              금액 및 내역 저장
            </button>
          </form>
          <Link href="/tax-history" className="btn-secondary" >
            내역 보기
          </Link>
        </div>

        <div className="card">
          <h2 className="section-title">직업 요청 관리</h2>
          <p className="section-desc">
            국세청장·은행원·경찰서장 직업 사용자의 승인 요청을 처리합니다.
          </p>
          <Link href="/admin/requests" className="btn-primary">
            요청 목록 보기
          </Link>
        </div>

        <div className="card">
          <h2 className="section-title">상점 관리</h2>
          <p className="section-desc">
            상점 상품을 추가·수정·삭제할 수 있습니다.
          </p>
          <Link href="/shop" className="btn-primary">
            상점으로 이동하기
          </Link>
        </div>

        <div className="card">
          <h2 className="section-title">학생 관리</h2>
          <p className="section-desc">
            학생 이름을 클릭하면 해당 학생의 탈퇴 처리, 직업 부여, 통장 거래내역
            관리가 가능한 페이지로 이동합니다.
          </p>
          {withBalances.length === 0 ? (
            <p>아직 가입한 학생이 없습니다.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>아이디</th>
                  <th>직업</th>
                  <th>통장 잔액</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {withBalances.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <Link
                        href={`/admin/users/${u.username}`}
                        className="student-name-link"
                      >
                        {u.name}
                      </Link>
                    </td>
                    <td>{u.username}</td>
                    <td>{u.job ?? "—"}</td>
                    <td>{u.balance.toLocaleString("ko-KR")}피스</td>
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

  const jobSlug = dbUser.job && hasJobSpecialPage(dbUser.job) ? JOB_TO_SLUG[dbUser.job] : null;

  return (
    <section className="grid-two">
      <div className="card">
        <h2 className="section-title">우리 나라 세금</h2>
        <p className="amount">
          {globalState.globalTax.toLocaleString("ko-KR")}피스
        </p>
        <Link href="/tax-history" className="btn-secondary">
          내역 보기
        </Link>
      </div>
      <div className="card">
        <h2 className="section-title">내 통장 잔액</h2>
        <p className="amount">{balance.toLocaleString("ko-KR")}피스</p>
        <p className="section-desc">
          나에게만 해당되는 가상의 통장 잔액입니다. 입금/출금 내역은 관리자만
          수정할 수 있습니다.
        </p>
        <Link href="/transactions" className="btn-primary">
          거래내역 보기
        </Link>
      </div>
      <div className="card">
        <h2 className="section-title">상점</h2>
        <p className="section-desc">
          열심히 모은 피스를 사용해봅시다!
        </p>
        <Link href="/shop" className="btn-primary">
          상점으로 이동하기
        </Link>
      </div>
      {jobSlug && dbUser.job && (
        <div className="card">
          <h2 className="section-title">{dbUser.job}</h2>
          <p className="section-desc">
            직업 전용 기능을 사용할 수 있습니다.
          </p>
          <Link href={`/job/${jobSlug}`} className="btn-primary">
            {dbUser.job} 메뉴로 이동
          </Link>
        </div>
      )}
    </section>
  );
}

