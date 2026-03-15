"use server";

import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/** 일반 사용자: 상품 구매 — 통장 출금 + 상품 잔고 감소 + 출금 내역 추가 */
export async function purchaseAction(itemId: number, quantity: number) {
  const session = await getSessionUser();
  if (!session) redirect("/");
  if (session.role === "admin") redirect("/shop");

  const item = await prisma.shopItem.findUnique({ where: { id: itemId } });
  if (!item) redirect("/shop");
  if (quantity < 1 || quantity > item.stock) redirect("/shop");

  const totalCost = item.price * quantity;
  const txs = await prisma.transaction.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "asc" },
  });
  const balance = txs.reduce(
    (acc, t) => acc + (t.type === "deposit" ? t.amount : -t.amount),
    0
  );
  if (balance < totalCost) redirect("/shop");

  const description = `${item.name} 상품 ${quantity}개 구매`;

  await prisma.$transaction([
    prisma.transaction.create({
      data: {
        userId: session.id,
        type: "withdraw",
        amount: totalCost,
        description,
      },
    }),
    prisma.shopItem.update({
      where: { id: itemId },
      data: { stock: { decrement: quantity } },
    }),
  ]);

  revalidatePath("/shop");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
}

/** 관리자: 상품 추가 */
export async function addShopItemAction(formData: FormData) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") redirect("/");

  const name = (formData.get("name") ?? "").toString().trim();
  const priceStr = (formData.get("price") ?? "0").toString();
  const stockStr = (formData.get("stock") ?? "0").toString();
  const price = parseInt(priceStr, 10);
  const stock = parseInt(stockStr, 10);

  if (!name || isNaN(price) || price < 0 || isNaN(stock) || stock < 0) {
    redirect("/shop");
  }

  const maxOrder = await prisma.shopItem
    .aggregate({ _max: { order: true } })
    .then((r) => r._max.order ?? -1);

  await prisma.shopItem.create({
    data: { name, price, stock, order: maxOrder + 1 },
  });

  revalidatePath("/shop");
}

/** 관리자: 상품 수정 (이름, 가격, 재고) */
export async function editShopItemAction(itemId: number, formData: FormData) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") redirect("/");

  const item = await prisma.shopItem.findUnique({ where: { id: itemId } });
  if (!item) redirect("/shop");

  const name = (formData.get("name") ?? item.name).toString().trim();
  const priceStr = (formData.get("price") ?? String(item.price)).toString();
  const stockStr = (formData.get("stock") ?? String(item.stock)).toString();
  const price = parseInt(priceStr, 10);
  const stock = parseInt(stockStr, 10);

  if (!name || isNaN(price) || price < 0 || isNaN(stock) || stock < 0) {
    redirect("/shop");
  }

  await prisma.shopItem.update({
    where: { id: itemId },
    data: { name, price, stock },
  });

  revalidatePath("/shop");
}

/** 관리자: 상품 삭제 (폼 제출 시 Next가 FormData를 두 번째 인자로 넘김) */
export async function deleteShopItemAction(
  itemId: number,
  _formData?: FormData
) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") redirect("/");

  await prisma.shopItem.delete({ where: { id: itemId } }).catch(() => {});
  revalidatePath("/shop");
}
