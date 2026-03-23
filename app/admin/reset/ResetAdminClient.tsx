"use client";

import Link from "next/link";
import { resetDepositAction, resetGlobalTaxAction, resetStudentsAction } from "./actions";

type StudentRow = {
  id: number;
  name: string;
  username: string;
  job: string | null;
};

export function ResetAdminClient({ students }: { students: StudentRow[] }) {
  return (
    <section className="card">
      <h2 className="section-title">초기화 (관리자)</h2>
      <p className="section-desc">
        아래 항목을 선택하고 버튼을 누르면, 정말로 초기화하시겠습니까? 확인 후 요청이 처리됩니다.
      </p>

      <div style={{ display: "grid", gap: "1rem" }}>
        <div className="reset-block">
          <h3 className="sub-title">우리 나라 세금</h3>
          <form
            action={resetGlobalTaxAction}
            onSubmit={(e) => {
              const form = e.currentTarget;
              const confirmChecked = form.querySelector(
                'input[name="confirm"]:checked',
              ) as HTMLInputElement | null;

              if (!confirmChecked) {
                e.preventDefault();
                return;
              }

              if (!window.confirm("정말로 초기화하시겠습니까?")) {
                e.preventDefault();
              }
            }}
          >
            <label className="form-label-inline" style={{ display: "block", marginBottom: "0.75rem" }}>
              <input type="checkbox" name="confirm" value="1" /> 우리 나라 세금
            </label>
            <button type="submit" className="btn-danger">
              초기화
            </button>
          </form>
        </div>

        <div className="reset-block">
          <h3 className="sub-title">예금 관리</h3>
          <form
            action={resetDepositAction}
            onSubmit={(e) => {
              const form = e.currentTarget;
              const confirmChecked = form.querySelector(
                'input[name="confirm"]:checked',
              ) as HTMLInputElement | null;

              if (!confirmChecked) {
                e.preventDefault();
                return;
              }

              if (!window.confirm("정말로 초기화하시겠습니까?")) {
                e.preventDefault();
              }
            }}
          >
            <label className="form-label-inline" style={{ display: "block", marginBottom: "0.75rem" }}>
              <input type="checkbox" name="confirm" value="1" /> 예금 관리
            </label>
            <button type="submit" className="btn-danger">
              초기화
            </button>
          </form>
        </div>

        <div className="reset-block">
          <h3 className="sub-title">학생 관리</h3>
          <form
            action={resetStudentsAction}
            onSubmit={(e) => {
              const form = e.currentTarget;
              const checkedCount = form.querySelectorAll(
                'input[name="studentIds"]:checked',
              ).length;

              if (checkedCount === 0) {
                e.preventDefault();
                return;
              }

              if (!window.confirm("정말로 초기화하시겠습니까?")) {
                e.preventDefault();
              }
            }}
          >
            <p className="section-desc" style={{ marginTop: 0 }}>
              체크한 학생의 <strong>직업</strong>과 <strong>통장 거래내역</strong>이 초기화됩니다.
            </p>

            {students.length === 0 ? (
              <p>초기화할 학생이 없습니다.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>선택</th>
                    <th>이름</th>
                    <th>아이디</th>
                    <th>직업</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <input type="checkbox" name="studentIds" value={s.id} />
                      </td>
                      <td>{s.name}</td>
                      <td>{s.username}</td>
                      <td>{s.job ?? "미부여"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <button type="submit" className="btn-danger" style={{ marginTop: "1rem" }}>
              초기화
            </button>
          </form>
        </div>

        <div>
          <Link href="/dashboard" className="btn-secondary">
            대시보드로 돌아가기
          </Link>
        </div>
      </div>
    </section>
  );
}

