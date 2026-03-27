"use client";

import { useFormState } from "react-dom";
import { getPasswordHint, type ForgotPasswordState } from "./actions";

const initialState: ForgotPasswordState = { hint: null, error: null };

export function ForgotPasswordForm() {
  const [state, action] = useFormState(getPasswordHint, initialState);

  return (
    <form action={action} className="form">
      <label className="form-label">
        아이디
        <input name="username" required />
      </label>
      <button type="submit" className="btn-primary">
        힌트 보기
      </button>

      {state.error && <p className="error-text">{state.error}</p>}
      {state.hint && (
        <p className="hint-box">
          <strong>힌트:</strong> {state.hint}
        </p>
      )}
    </form>
  );
}

