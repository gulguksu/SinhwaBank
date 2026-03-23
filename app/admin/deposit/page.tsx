import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  ensureDefaultDepositProducts,
  addDepositProduct,
  editDepositProduct,
  deleteDepositProduct,
} from "@/app/deposit/actions";

function formatKoreanDate(d: Date) {
  return d.toLocaleString("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  });
}

function getDepositStatusLabel(status: string) {
  if (status === "ongoing") return "진행 중";
  if (status === "waiting_payout") return "지급 대기";
  if (status === "paid") return "수령 완료";
  if (status === "cancelled") return "중도 포기";
  return status;
}

export default async function AdminDepositPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") redirect("/");

  await ensureDefaultDepositProducts();

  const [products, subs] = await Promise.all([
    prisma.depositProduct.findMany({
      orderBy: { order: "asc" },
    }),
    prisma.depositSubscription.findMany({
      include: { user: true, product: true },
      orderBy: { startedAt: "desc" },
    }),
  ]);

  return (
    <section className="card">
      <h2 className="section-title">예금 관리 (관리자)</h2>
      <p className="section-desc">
        예금 상품을 추가·수정·삭제하고, 학생들의 예금 가입 현황을 확인할 수 있습니다.
      </p>

      <h3 className="sub-title">예금 상품 목록</h3>
      <form action={addDepositProduct} className="form-inline" style={{ marginBottom: "1rem" }}>
        <input type="text" name="name" placeholder="상품명" required />
        <input type="number" name="interestRate" placeholder="이자율(%)" required />
        <input type="number" name="maturityWeeks" placeholder="만기(주)" min={0} required />
        <button type="submit" className="btn-primary">
          상품 추가
        </button>
      </form>

      {products.length === 0 ? (
        <p>등록된 예금 상품이 없습니다.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>이름</th>
              <th>이자율</th>
              <th>만기 기간</th>
              <th>활성</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.interestRate}%</td>
                <td>{p.maturityWeeks === 0 ? "테스트(30초)" : `${p.maturityWeeks}주`}</td>
                <td>{p.isActive ? "예" : "아니오"}</td>
                <td>
                  <form action={editDepositProduct.bind(null, p.id)} className="inline-form">
                    <input
                      type="text"
                      name="name"
                      defaultValue={p.name}
                      style={{ minWidth: "120px" }}
                    />
                    <input
                      type="number"
                      name="interestRate"
                      defaultValue={p.interestRate}
                      style={{ width: "4rem" }}
                    />
                    <input
                      type="number"
                      name="maturityWeeks"
                      defaultValue={p.maturityWeeks}
                      style={{ width: "4rem" }}
                      min={0}
                    />
                    <label className="form-label-inline" style={{ marginLeft: "0.5rem" }}>
                      <input type="checkbox" name="isActive" defaultChecked={p.isActive} />
                      사용
                    </label>
                    <button type="submit" className="btn-secondary btn-small">
                      수정
                    </button>
                  </form>
                  <form
                    action={deleteDepositProduct.bind(null, p.id)}
                    style={{ display: "inline", marginLeft: "0.25rem" }}
                  >
                    <button type="submit" className="btn-danger btn-small">
                      삭제
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 className="sub-title">학생 예금 가입 현황</h3>
      {subs.length === 0 ? (
        <p>아직 예금에 가입한 학생이 없습니다.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>학생</th>
              <th>상품</th>
              <th>원금</th>
              <th>이자율</th>
              <th>만기 기간</th>
              <th>시작일</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id}>
                <td>{s.user.name}</td>
                <td>{s.product.name}</td>
                <td>{s.principal.toLocaleString("ko-KR")}피스</td>
                <td>{s.interestRate}%</td>
                <td>{s.maturityWeeks === 0 ? "테스트(30초)" : `${s.maturityWeeks}주`}</td>
                <td>{formatKoreanDate(s.startedAt)}</td>
                <td>{getDepositStatusLabel(s.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Link href="/dashboard" className="btn-secondary">
        대시보드로 돌아가기
      </Link>
    </section>
  );
}

