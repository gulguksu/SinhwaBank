"use client";

type Props = {
  username: string;
  action: (username: string) => Promise<void>;
};

export function WithdrawForm({ username, action }: Props) {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!confirm("정말 이 학생을 탈퇴 처리하시겠습니까?")) return;
    await action(username);
  }

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <button type="submit" className="btn-danger">
        탈퇴 처리
      </button>
    </form>
  );
}
