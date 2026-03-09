import { ForgotPasswordForm } from "./ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <section className="auth-wrapper">
      <div className="auth-card">
        <h2 className="section-title">비밀번호 찾기</h2>
        <p className="auth-helper" style={{ marginBottom: "1rem" }}>
          가입 시 사용한 아이디를 입력하면 비밀번호 힌트를 보여드립니다.
        </p>
        <ForgotPasswordForm />
      </div>
    </section>
  );
}
