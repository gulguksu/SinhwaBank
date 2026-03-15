import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureDefaultShopItems } from "@/lib/shop";
import {
  addShopItemAction,
  editShopItemAction,
  deleteShopItemAction,
} from "./actions";
import { ShopPurchase } from "./ShopPurchase";

export default async function ShopPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");

  await ensureDefaultShopItems();

  const items = await prisma.shopItem.findMany({
    orderBy: { order: "asc" },
  });

  let balance: number | null = null;
  if (user.role === "user") {
    const txs = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });
    balance = txs.reduce(
      (acc, t) => acc + (t.type === "deposit" ? t.amount : -t.amount),
      0
    );
  }

  const isAdmin = user.role === "admin";

  return (
    <section className="card">
      <h2 className="section-title">상점</h2>
      {balance !== null && (
        <div className="balance-box">
          <span>내 잔고</span>
          <strong>{balance.toLocaleString("ko-KR")}피스</strong>
        </div>
      )}

      {isAdmin && (
        <div className="admin-actions-block">
          <h3 className="sub-title">상품 추가</h3>
          <form action={addShopItemAction} className="form-inline">
            <input
              type="text"
              name="name"
              placeholder="상품명"
              required
            />
            <input
              type="number"
              name="price"
              placeholder="가격(피스)"
              min={0}
              required
            />
            <input
              type="number"
              name="stock"
              placeholder="재고"
              min={0}
              defaultValue={0}
            />
            <button type="submit" className="btn-primary">
              추가
            </button>
          </form>
        </div>
      )}

      <h3 className="sub-title">판매 중인 물건</h3>
      {items.length === 0 ? (
        <p>등록된 상품이 없습니다.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>상품명</th>
              <th>가격</th>
              <th>잔고</th>
              {!isAdmin && <th>구매</th>}
              {isAdmin && <th>관리</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td className="text-right">
                  {item.price.toLocaleString("ko-KR")}피스
                </td>
                <td className="text-right">{item.stock}개</td>
                {!isAdmin && (
                  <td>
                    <ShopPurchase
                      itemId={item.id}
                      name={item.name}
                      price={item.price}
                      stock={item.stock}
                    />
                  </td>
                )}
                {isAdmin && (
                  <td>
                    <form
                      action={editShopItemAction.bind(null, item.id)}
                      className="edit-inline-form inline-form"
                      style={{ display: "inline-flex", flexWrap: "wrap", gap: "0.25rem" }}
                    >
                      <input
                        type="text"
                        name="name"
                        defaultValue={item.name}
                        placeholder="상품명"
                        style={{ minWidth: "100px" }}
                      />
                      <input
                        type="number"
                        name="price"
                        defaultValue={item.price}
                        min={0}
                        style={{ width: "4rem" }}
                      />
                      <input
                        type="number"
                        name="stock"
                        defaultValue={item.stock}
                        min={0}
                        style={{ width: "3.5rem" }}
                      />
                      <button type="submit" className="btn-secondary btn-small">
                        수정
                      </button>
                    </form>
                    <form
                      action={deleteShopItemAction.bind(null, item.id)}
                      style={{ display: "inline", marginLeft: "0.25rem" }}
                    >
                      <button type="submit" className="btn-danger btn-small">
                        삭제
                      </button>
                    </form>
                  </td>
                )}
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
