"use client";

import { useTransition } from "react";
import { purchaseAction } from "./actions";

type Props = {
  itemId: number;
  name: string;
  price: number;
  stock: number;
};

export function ShopPurchase({ itemId, name, price, stock }: Props) {
  const [isPending, startTransition] = useTransition();
  const maxQty = Math.max(0, Math.min(stock, 99));

  function handleBuy() {
    const select = document.getElementById(`qty-${itemId}`) as HTMLSelectElement;
    const qty = select ? parseInt(select.value, 10) : 1;
    if (qty < 1 || qty > stock) return;
    const ok = window.confirm(
      `${name} 상품을 ${qty}개 구매하시겠습니까?`
    );
    if (!ok) return;
    startTransition(() => {
      purchaseAction(itemId, qty);
    });
  }

  if (stock <= 0) {
    return <span className="section-desc">품절</span>;
  }

  return (
    <div className="inline-form">
      <label htmlFor={`qty-${itemId}`} className="form-label-inline">
        수량
        <select id={`qty-${itemId}`} defaultValue="1">
          {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="btn-primary"
        onClick={handleBuy}
        disabled={isPending}
      >
        {isPending ? "처리 중…" : "구매"}
      </button>
    </div>
  );
}
