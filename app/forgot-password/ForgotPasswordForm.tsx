"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { getPasswordHint, type ForgotPasswordState } from "./actions";

const initialState: ForgotPasswordState = {
  hint: null,
  error: null,
};

export function ForgotPasswordForm() {
  const [state, formAction] = useFormState(getPasswordHint, initialState);

  return (
    <>
      <form action={formAction} className="form">
        <label className="form-label">
          아이디
          <input
            name="username"
            required
            pattern="[a-z0-9]+"
            title="영어 소문자와 숫자만 사용 가능합니다."
            placeholder="가입 시 사용한 아이디"
          />
        </label>
        <button type="submit" className="btn-primary">
          힌트 보기
        </button>
      </form>

      {state.error && (
        <p className="auth-helper" style={{ color: "var(--color-error, #c00)" }}>
          {state.error}
        </p>
      )}

      {state.hint && (
        <div className="form" style={{ marginTop: "1rem" }}>
          <p className="form-label">
            <strong>비밀번호 힌트:</strong>
            <span style={{ display: "block", marginTop: "0.5rem" }}>
              {state.hint}
            </span>
          </p>
          <Link href="/" className="btn-primary" style={{ display: "inline-block", textAlign: "center", textDecoration: "none" }}>
            로그인하기
          </Link>
        </div>
      )}
    </>
  );
}
