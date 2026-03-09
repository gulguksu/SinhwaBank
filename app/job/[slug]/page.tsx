import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SLUG_TO_JOB, JOB_TO_SLUG, BANK_PAYMENT_DESCRIPTIONS } from "@/lib/constants";
import {
  submitTaxChangeByDeltaRequest,
  submitBankPaymentRequest,
  submitPoliceFineRequest,
  cancelTaxChangeRequest,
  cancelBankPaymentRequest,
  cancelPoliceFineRequest,
  deleteTaxChangeRequest,
  deleteBankPaymentRequest,
  deletePoliceFineRequest,
} from "./actions";

const VALID_SLUGS = ["tax-commissioner", "banker", "police"] as const;

export default async function JobPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!VALID_SLUGS.includes(slug as (typeof VALID_SLUGS)[number])) {
    notFound();
  }

  const user = await getSessionUser();
  if (!user || user.role !== "user") redirect("/");

  const jobTitle = SLUG_TO_JOB[slug];
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.job !== jobTitle) redirect("/dashboard");

  if (slug === "tax-commissioner") {
    const [requests, globalState] = await Promise.all([
      prisma.taxChangeRequest.findMany({
        where: { requestedById: user.id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.globalState.findUnique({ where: { id: 1 } }).then((s) => s ?? prisma.globalState.create({ data: { id: 1, globalTax: 0 } })),
    ]);
    const currentTax = globalState.globalTax;
    return (
      <section className="card">
        <h2 className="section-title">국세청장</h2>
        <p className="section-desc">
          우리 나라 세금 금액 조정을 관리자에게 요청할 수 있습니다. 승인 시 실제 세금이 변경됩니다.
        </p>
        <div className="balance-box" style={{ marginBottom: "1rem" }}>
          <span>현재 우리 나라 세금</span>
          <strong>{currentTax.toLocaleString("ko-KR")}피스</strong>
        </div>
        <form action={submitTaxChangeByDeltaRequest} className="form">
          <label className="form-label">
            변동할 금액 (피스)
            <input type="number" name="amount" min={1} required />
          </label>
          <label className="form-label">
            변동 내역
            <input
              type="text"
              name="description"
              placeholder="예: 세금 인상, 세금 감면 등"
              required
            />
          </label>
          <div className="form-inline" style={{ gap: "0.5rem", flexWrap: "wrap" }}>
            <button type="submit" name="mode" value="plus" className="btn-primary">
              더하기
            </button>
            <button type="submit" name="mode" value="minus" className="btn-secondary">
              빼기
            </button>
          </div>
        </form>
        <p className="section-desc" style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
          위 버튼을 누르면 현재 세금에서 입력한 금액만큼 더하거나 뺀 값으로 관리자에게 승인 요청이 전달됩니다.
        </p>
        <h3 className="sub-title">내가 보낸 요청</h3>
        {requests.length === 0 ? (
          <p>아직 보낸 요청이 없습니다.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>일시</th>
                <th>조정 후 금액</th>
                <th>내역</th>
                <th>상태</th>
                <th>처리</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.createdAt.toLocaleString("ko-KR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                  <td>{r.newAmount.toLocaleString("ko-KR")}피스</td>
                  <td>{r.description}</td>
                  <td>
                    {r.status === "pending" && "대기 중"}
                    {r.status === "approved" && "승인됨"}
                    {r.status === "rejected" && "거절됨"}
                    {r.status === "cancelled" && "취소됨"}
                  </td>
                  <td>
                    {r.status === "pending" && (
                      <form action={cancelTaxChangeRequest.bind(null, r.id)} className="inline-form">
                        <button type="submit" className="btn-danger btn-small">
                          요청 취소
                        </button>
                      </form>
                    )}
                    {r.status === "cancelled" && (
                      <form action={deleteTaxChangeRequest.bind(null, r.id)} className="inline-form">
                        <button type="submit" className="btn-danger btn-small">
                          삭제
                        </button>
                      </form>
                    )}
                  </td>
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

  if (slug === "banker") {
    const students = await prisma.user.findMany({
      where: { isAdmin: false },
      orderBy: { name: "asc" },
    });
    const requests = await prisma.bankPaymentRequest.findMany({
      where: { requestedById: user.id },
      include: { target: true },
      orderBy: { createdAt: "desc" },
    });
    return (
      <section className="card">
        <h2 className="section-title">은행원</h2>
        <p className="section-desc">
          자신을 포함한 일반 사용자에게 통장 지급을 요청할 수 있습니다. 관리자 승인 시 해당 사용자에게 입금됩니다.
        </p>
        <form action={submitBankPaymentRequest} className="form">
          <label className="form-label">
            지급 대상
            <select name="targetUserId" required>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.username})
                </option>
              ))}
            </select>
          </label>
          <label className="form-label">
            금액 (피스)
            <input type="number" name="amount" min={1} required />
          </label>
          <label className="form-label">
            내역
            <select name="description" required>
              {BANK_PAYMENT_DESCRIPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn-primary">
            관리자에게 승인 요청
          </button>
        </form>
        <h3 className="sub-title">내가 보낸 요청</h3>
        {requests.length === 0 ? (
          <p>아직 보낸 요청이 없습니다.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>일시</th>
                <th>대상</th>
                <th>금액</th>
                <th>내역</th>
                <th>상태</th>
                <th>처리</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.createdAt.toLocaleString("ko-KR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                  <td>{r.target.name}</td>
                  <td>{r.amount.toLocaleString("ko-KR")}피스</td>
                  <td>{r.description}</td>
                  <td>
                    {r.status === "pending" && "대기 중"}
                    {r.status === "approved" && "승인됨"}
                    {r.status === "rejected" && "거절됨"}
                    {r.status === "cancelled" && "취소됨"}
                  </td>
                  <td>
                    {r.status === "pending" && (
                      <form action={cancelBankPaymentRequest.bind(null, r.id)} className="inline-form">
                        <button type="submit" className="btn-danger btn-small">
                          요청 취소
                        </button>
                      </form>
                    )}
                    {r.status === "cancelled" && (
                      <form action={deleteBankPaymentRequest.bind(null, r.id)} className="inline-form">
                        <button type="submit" className="btn-danger btn-small">
                          삭제
                        </button>
                      </form>
                    )}
                  </td>
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

  // police
  const students = await prisma.user.findMany({
    where: { isAdmin: false },
    orderBy: { name: "asc" },
  });
  const requests = await prisma.policeFineRequest.findMany({
    where: { requestedById: user.id },
    include: { target: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <section className="card">
      <h2 className="section-title">경찰서장</h2>
      <p className="section-desc">
        자신을 포함한 일반 사용자에게 벌금(통장 출금)을 요청할 수 있습니다. 관리자 승인 시 해당 사용자 통장에서 출금되고, 그 금액만큼 우리 나라 세금으로 들어갑니다.
      </p>
      <form action={submitPoliceFineRequest} className="form">
        <label className="form-label">
          벌금 부과 대상
          <select name="targetUserId" required>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.username})
              </option>
            ))}
          </select>
        </label>
        <label className="form-label">
          벌금 금액 (피스)
          <input type="number" name="amount" min={1} required />
        </label>
        <label className="form-label">
          위반 내역 (벌금 내역에 「[입력한 내용] 위반 벌금」으로 표시됩니다)
          <input
            type="text"
            name="violationDetail"
            placeholder="예: 교복 단정 착용"
            required
          />
        </label>
        <button type="submit" className="btn-primary">
          관리자에게 승인 요청
        </button>
      </form>
      <h3 className="sub-title">내가 보낸 요청</h3>
      {requests.length === 0 ? (
        <p>아직 보낸 요청이 없습니다.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>일시</th>
              <th>대상</th>
              <th>금액</th>
              <th>위반 내역</th>
              <th>상태</th>
              <th>처리</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td>
                  {r.createdAt.toLocaleString("ko-KR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </td>
                <td>{r.target.name}</td>
                <td>{r.amount.toLocaleString("ko-KR")}피스</td>
                <td>{r.violationDetail} 위반 벌금</td>
                <td>
                  {r.status === "pending" && "대기 중"}
                  {r.status === "approved" && "승인됨"}
                  {r.status === "rejected" && "거절됨"}
                  {r.status === "cancelled" && "취소됨"}
                </td>
                <td>
                  {r.status === "pending" && (
                    <form action={cancelPoliceFineRequest.bind(null, r.id)} className="inline-form">
                      <button type="submit" className="btn-danger btn-small">
                        요청 취소
                      </button>
                    </form>
                  )}
                  {r.status === "cancelled" && (
                    <form action={deletePoliceFineRequest.bind(null, r.id)} className="inline-form">
                      <button type="submit" className="btn-danger btn-small">
                        삭제
                      </button>
                    </form>
                  )}
                </td>
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
