import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { JOB_OPTIONS } from "@/lib/constants";
import {
  addTransactionAction,
  deleteTransactionAction,
  editTransactionAction,
  withdrawUserAction,
  updateJobAction,
} from "./txActions";
import { WithdrawForm } from "./WithdrawForm";

export default async function AdminUserPage({
  params,
  searchParams,
}: {
  params: { username: string };
  searchParams?: { page?: string; pageSize?: string };
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

  const page = Number(searchParams?.page ?? "1") || 1;
  const pageSizeRaw = Number(searchParams?.pageSize ?? "5") || 5;
  const pageSize = Math.min(Math.max(pageSizeRaw, 5), 30);
  const skip = (page - 1) * pageSize;

  const totalCount = await prisma.transaction.count({
    where: { userId: dbUser.id },
  });
  const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1);

  const txs = await prisma.transaction.findMany({
    where: { userId: dbUser.id },
    orderBy: { createdAt: "asc" },
    skip,
    take: pageSize,
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
            <strong>현재 잔액</strong> {balance.toLocaleString("ko-KR")}피스
          </li>
          <li>
            <strong>직업</strong> {dbUser.job ?? "미부여"}
          </li>
        </ul>

        <div className="admin-actions-block">
          <h3 className="sub-title">직업 부여</h3>
          <form
            action={updateJobAction.bind(null, dbUser.username)}
            className="form-inline form-job"
          >
            <label className="form-label-inline">
              직업 선택
              <select name="job" defaultValue={dbUser.job ?? ""}>
                <option value="">미부여</option>
                {JOB_OPTIONS.map((job) => (
                  <option key={job} value={job}>
                    {job}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="btn-primary">
              직업 저장
            </button>
          </form>
        </div>

        <div className="admin-actions-block">
          <h3 className="sub-title">탈퇴시키기</h3>
          <p className="section-desc danger-desc">
            이 학생의 계정을 삭제합니다. 삭제 후 동일한 아이디·비밀번호·이름으로
            재가입할 수 있으며, 재가입 시 통장 잔액은 0피스부터 시작합니다.
          </p>
          <WithdrawForm
            username={dbUser.username}
            action={withdrawUserAction}
          />
        </div>

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
          <>
            <table className="table">
              <thead>
                <tr>
                  <th className="col-type">구분</th>
                  <th>금액</th>
                  <th>내용</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {txs.map((t) => (
                  <tr key={t.id}>
                    <td className="col-type">
                      {t.type === "deposit" ? "입금" : "출금"}
                    </td>
                    <td className="text-right">
                      {t.type === "deposit" ? "+" : "-"}
                      {t.amount.toLocaleString("ko-KR")}피스
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
                        <button
                          type="submit"
                          className="btn-secondary btn-small"
                        >
                          수정
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pagination-controls">
              <form method="get" className="inline-form page-size-form">
                <input type="hidden" name="page" value="1" />
                <label>
                  한 페이지에
                  <select
                    name="pageSize"
                    defaultValue={pageSize.toString()}
                  >
                    <option value="5">5개</option>
                    <option value="10">10개</option>
                    <option value="20">20개</option>
                    <option value="30">30개</option>
                  </select>
                  보기
                </label>
                <button type="submit" className="btn-secondary btn-small">
                  변경
                </button>
              </form>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <Link
                      key={p}
                      href={`/admin/users/${dbUser.username}?page=${p}&pageSize=${pageSize}`}
                      className={
                        "page-link" + (p === page ? " page-link-active" : "")
                      }
                    >
                      {p}
                    </Link>
                  )
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

