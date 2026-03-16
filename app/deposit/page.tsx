import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  ensureDefaultDepositProducts,
  subscribeDeposit,
  requestMaturityPayout,
  addDepositProduct,
  editDepositProduct,
} from "./actions";
import { EarlyCancelButton } from "./EarlyCancelButton";

function formatKoreanDate(d: Date) {
  return d.toLocaleString("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  });
}

export default async function DepositPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/");
  }

  await ensureDefaultDepositProducts();

  const products = await prisma.depositProduct.findMany({
    orderBy: { order: "asc" },
  });

  const isAdmin = user.role === "admin";

  if (isAdmin) {
    const subs = await prisma.depositSubscription.findMany({
      include: { user: true, product: true },
      orderBy: { startedAt: "desc" },
    });

    return (
      <section className="card">
        <h2 className="section-title">예금 (관리자)</h2>
        <p className="section-desc">
          예금 상품의 이자율과 만기 기간을 관리하고, 학생들의 예금 가입 현황을 확인할 수 있습니다.
        </p>

        <h3 className="sub-title">예금 상품 목록</h3>
        <form action={addDepositProduct} className="form-inline" style={{ marginBottom: "1rem" }}>
          <input
            type="text"
            name="name"
            placeholder="상품명"
            required
          />
          <input
            type="number"
            name="interestRate"
            placeholder="이자율(%)"
            required
          />
          <input
            type="number"
            name="maturityWeeks"
            placeholder="만기(주)"
            min={1}
            required
          />
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
                  <td>{p.maturityWeeks}주</td>
                  <td>{p.isActive ? "예" : "아니오"}</td>
                  <td>
                    <form
                      action={editDepositProduct.bind(null, p.id)}
                      className="inline-form"
                    >
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
                        min={1}
                      />
                      <label className="form-label-inline" style={{ marginLeft: "0.5rem" }}>
                        <input
                          type="checkbox"
                          name="isActive"
                          defaultChecked={p.isActive}
                        />
                        사용
                      </label>
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
                  <td>{s.maturityWeeks}주</td>
                  <td>{formatKoreanDate(s.startedAt)}</td>
                  <td>{s.status}</td>
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

  if (user.role !== "user") {
    redirect("/");
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) redirect("/");

  const subs = await prisma.depositSubscription.findMany({
    where: { userId: dbUser.id },
    include: { product: true },
    orderBy: { startedAt: "desc" },
  });

  function calcMaturityDate(startedAt: Date, weeks: number, productName?: string | null) {
    const d = new Date(startedAt);
    if (weeks > 0) {
      d.setDate(d.getDate() + weeks * 7);
      return d;
    }
    // 테스트용 30초 상품: 주 단위가 0이고 이름에 30초가 포함된 경우
    if (productName && productName.includes("30초")) {
      d.setSeconds(d.getSeconds() + 30);
      return d;
    }
    return d;
  }

  function calcMaturityAmount(principal: number, rate: number) {
    return Math.floor(principal * (1 + rate / 100));
  }

  const now = new Date();

  return (
    <section className="card">
      <h2 className="section-title">예금</h2>
      <p className="section-desc">
        예금 상품에 돈을 저축하면, 만기 기간이 될 때까지 돈을 쓸 수 없습니다. 하지만 끝까지 참고 기다린다면 이자를 추가로 받을 수 있습니다. 중간에 포기하면 원금만 돌려받게 됩니다.
      </p>

      <h3 className="sub-title">예금 상품</h3>
      {products.length === 0 ? (
        <p>현재 가입 가능한 예금 상품이 없습니다.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>상품명</th>
              <th>이자율</th>
              <th>만기 기간</th>
              <th>가입</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.interestRate}%</td>
                <td>{p.maturityWeeks}주</td>
                <td>
                  <form action={subscribeDeposit} className="form-inline">
                    <input type="hidden" name="productId" value={p.id} />
                    <label className="form-label-inline">
                      금액
                      <input
                        type="number"
                        name="amount"
                        min={50}
                        placeholder="최소 50피스"
                        required
                      />
                    </label>
                    <button type="submit" className="btn-primary">
                      가입하기
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 className="sub-title">내 예금</h3>
      {subs.length === 0 ? (
        <p>가입한 예금이 없습니다.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>상품</th>
              <th>원금</th>
              <th>이자율</th>
              <th>만기 기간</th>
              <th>시작일</th>
              <th>만기 일자</th>
              <th>만기 시 수령금액</th>
              <th>상태</th>
              <th>처리</th>
            </tr>
          </thead>
          <tbody>
            {subs.map((s) => {
              const maturityDate = calcMaturityDate(
                s.startedAt,
                s.maturityWeeks,
                s.product?.name
              );
              const maturityAmount = calcMaturityAmount(s.principal, s.interestRate);
              const isMatured = now >= maturityDate;
              let statusLabel = "진행 중";
              if (s.status === "waiting_payout") statusLabel = "지급 대기";
              if (s.status === "cancelled") statusLabel = "중도 포기";
              if (s.status === "paid") statusLabel = "수령 완료";

              return (
                <tr key={s.id}>
                  <td>{s.product?.name ?? s.productId}</td>
                  <td>{s.principal.toLocaleString("ko-KR")}피스</td>
                  <td>{s.interestRate}%</td>
                  <td>{s.maturityWeeks}주</td>
                  <td>{formatKoreanDate(s.startedAt)}</td>
                  <td>{formatKoreanDate(maturityDate)}</td>
                  <td>{maturityAmount.toLocaleString("ko-KR")}피스</td>
                  <td>{statusLabel}</td>
                  <td>
                    {s.status === "ongoing" && !isMatured && (
                      <EarlyCancelButton subscriptionId={s.id} />
                    )}
                    {s.status === "ongoing" && isMatured && (
                      <form action={requestMaturityPayout.bind(null, s.id)}>
                        <button type="submit" className="btn-primary btn-small">
                          수령하기
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <Link href="/dashboard" className="btn-secondary">
        대시보드로 돌아가기
      </Link>
    </section>
  );
}

