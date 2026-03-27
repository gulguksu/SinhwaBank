import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { setGlobalTaxAction } from "./setGlobalTaxAction";
import { hasJobSpecialPage, JOB_TO_SLUG } from "@/lib/constants";
import { getBalancesByUserIds, getUserBalance } from "@/lib/balance";

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
      select: {
        id: true,
        username: true,
        name: true,
        job: true,
      },
    });
    const balances = await getBalancesByUserIds(users.map((u) => u.id));
    const withBalances = users.map((u) => {
      return { ...u, balance: balances.get(u.id) ?? 0 };
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
          <h2 className="section-title">예금 관리</h2>
          <p className="section-desc">
            예금 상품을 추가·수정·삭제하고 학생 예금 가입 현황을 확인합니다.
          </p>
          <Link href="/admin/deposit" className="btn-primary">
            예금 관리 페이지로 이동
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

        <div className="card">
          <h2 className="section-title">초기화</h2>
          <p className="section-desc">
            우리 나라 세금 내역, 학생 예금 가입 현황, 선택한 학생의 직업/통장 거래내역을
            초기화할 수 있습니다.
          </p>
          <Link href="/admin/reset" className="btn-danger">
            초기화 페이지로 이동
          </Link>
        </div>
      </section>
    );
  }

  // 일반 사용자
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) {
    redirect("/");
  }
  const balance = await getUserBalance(dbUser.id);

  const jobSlug = dbUser.job && hasJobSpecialPage(dbUser.job) ? JOB_TO_SLUG[dbUser.job] : null;

  return (
    <section className="grid-two">
      <div className="card">
        <h2 className="section-title">최신국 세금</h2>
        <p className="amount">
          {globalState.globalTax.toLocaleString("ko-KR")}피스
        </p>
        <p className="section-desc">
          우리 최신국의 현재 세금입니다.
        </p>
        <Link href="/tax-history" className="btn-secondary">
          내역 보기
        </Link>
      </div>
      <div className="card">
        <h2 className="section-title">내 통장 잔액</h2>
        <p className="amount">{balance.toLocaleString("ko-KR")}피스</p>
        <p className="section-desc">
          내 통장에서 피스가 어떻게 들어오고 나갔는지 확인해봅시다.
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
      <div className="card">
        <h2 className="section-title">예금</h2>
        <p className="section-desc">
          열심히 모은 돈으로 예금 상품에 가입해보세요!
        </p>
        <Link href="/deposit" className="btn-primary">
          은행으로 이동하기
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

