import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  approveTaxChangeRequest,
  rejectTaxChangeRequest,
  approveBankPaymentRequest,
  rejectBankPaymentRequest,
  approvePoliceFineRequest,
  rejectPoliceFineRequest,
} from "./actions";

export default async function AdminRequestsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") redirect("/");

  const [taxRequests, bankRequests, policeRequests] = await Promise.all([
    prisma.taxChangeRequest.findMany({
      where: { status: "pending" },
      include: { requestedBy: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.bankPaymentRequest.findMany({
      where: { status: "pending" },
      include: { requestedBy: true, target: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.policeFineRequest.findMany({
      where: { status: "pending" },
      include: { requestedBy: true, target: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <section className="card">
      <h2 className="section-title">직업 요청 관리</h2>
      <p className="section-desc">
        국세청장·은행원·경찰서장이 보낸 승인 요청을 처리합니다.
      </p>
      <p style={{ marginBottom: "1rem" }}>
        <Link href="/dashboard" className="btn-secondary">
          대시보드로 돌아가기
        </Link>
      </p>

      <div className="admin-requests-block">
        <h3 className="sub-title">국세청장 — 세금 조정 요청</h3>
        {taxRequests.length === 0 ? (
          <p>대기 중인 요청이 없습니다.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>요청자</th>
                <th>요청 일시</th>
                <th>조정 후 금액</th>
                <th>내역</th>
                <th>처리</th>
              </tr>
            </thead>
            <tbody>
              {taxRequests.map((r) => (
                <tr key={r.id}>
                  <td>{r.requestedBy.name}</td>
                  <td>
                    {r.createdAt.toLocaleString("ko-KR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                  <td>{r.newAmount.toLocaleString("ko-KR")}피스</td>
                  <td>{r.description}</td>
                  <td>
                    <form
                      action={approveTaxChangeRequest.bind(null, r.id)}
                      className="inline-form"
                    >
                      <button type="submit" className="btn-primary btn-small">
                        승인
                      </button>
                    </form>
                    <form
                      action={rejectTaxChangeRequest.bind(null, r.id)}
                      className="inline-form"
                    >
                      <button type="submit" className="btn-danger btn-small">
                        거절
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="admin-requests-block">
        <h3 className="sub-title">은행원 — 통장 지급 요청</h3>
        {bankRequests.length === 0 ? (
          <p>대기 중인 요청이 없습니다.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>요청자</th>
                <th>지급 대상</th>
                <th>금액</th>
                <th>내역</th>
                <th>요청 일시</th>
                <th>처리</th>
              </tr>
            </thead>
            <tbody>
              {bankRequests.map((r) => (
                <tr key={r.id}>
                  <td>{r.requestedBy.name}</td>
                  <td>{r.target.name}</td>
                  <td>{r.amount.toLocaleString("ko-KR")}피스</td>
                  <td>{r.description}</td>
                  <td>
                    {r.createdAt.toLocaleString("ko-KR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                  <td>
                    <form
                      action={approveBankPaymentRequest.bind(null, r.id)}
                      className="inline-form"
                    >
                      <button type="submit" className="btn-primary btn-small">
                        승인
                      </button>
                    </form>
                    <form
                      action={rejectBankPaymentRequest.bind(null, r.id)}
                      className="inline-form"
                    >
                      <button type="submit" className="btn-danger btn-small">
                        거절
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="admin-requests-block">
        <h3 className="sub-title">경찰서장 — 벌금 징수 요청</h3>
        {policeRequests.length === 0 ? (
          <p>대기 중인 요청이 없습니다.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>요청자</th>
                <th>대상</th>
                <th>금액</th>
                <th>위반 내역</th>
                <th>요청 일시</th>
                <th>처리</th>
              </tr>
            </thead>
            <tbody>
              {policeRequests.map((r) => (
                <tr key={r.id}>
                  <td>{r.requestedBy.name}</td>
                  <td>{r.target.name}</td>
                  <td>{r.amount.toLocaleString("ko-KR")}피스</td>
                  <td>{r.violationDetail} 위반 벌금</td>
                  <td>
                    {r.createdAt.toLocaleString("ko-KR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                  <td>
                    <form
                      action={approvePoliceFineRequest.bind(null, r.id)}
                      className="inline-form"
                    >
                      <button type="submit" className="btn-primary btn-small">
                        승인
                      </button>
                    </form>
                    <form
                      action={rejectPoliceFineRequest.bind(null, r.id)}
                      className="inline-form"
                    >
                      <button type="submit" className="btn-danger btn-small">
                        거절
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
