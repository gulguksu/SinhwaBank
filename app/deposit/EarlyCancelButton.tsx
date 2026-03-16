"use client";

import { useTransition } from "react";
import { requestEarlyCancel } from "./actions";

type Props = {
  subscriptionId: number;
};

export function EarlyCancelButton({ subscriptionId }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const ok = window.confirm(
      "중도 포기 시 원금만을 돌려받게 됩니다. 계속하시겠습니까?"
    );
    if (!ok) return;
    startTransition(() => {
      requestEarlyCancel(subscriptionId);
    });
  }

  return (
    <button
      type="button"
      className="btn-secondary btn-small"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? "처리 중…" : "중도 포기"}
    </button>
  );
}

