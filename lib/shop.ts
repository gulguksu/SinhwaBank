import { prisma } from "@/lib/db";

const DEFAULT_ITEMS = [
  { name: "급식 1등 쿠폰", price: 20, order: 0 },
  { name: "신청곡 재생 쿠폰", price: 10, order: 1 },
  { name: "비타민캔디", price: 10, order: 2 },
] as const;

/** 상점에 상품이 하나도 없으면 기본 3종을 생성합니다. */
export async function ensureDefaultShopItems() {
  const count = await prisma.shopItem.count();
  if (count > 0) return;

  await prisma.shopItem.createMany({
    data: DEFAULT_ITEMS.map((item) => ({
      name: item.name,
      price: item.price,
      stock: 100,
      order: item.order,
    })),
  });
}
