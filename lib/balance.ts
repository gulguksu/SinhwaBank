import { prisma } from "@/lib/db";

export async function getUserBalance(userId: number): Promise<number> {
  const sums = await prisma.transaction.groupBy({
    by: ["type"],
    where: { userId },
    _sum: { amount: true },
  });

  let balance = 0;
  for (const row of sums) {
    const amount = row._sum.amount ?? 0;
    balance += row.type === "deposit" ? amount : -amount;
  }
  return balance;
}

export async function getBalancesByUserIds(
  userIds: number[]
): Promise<Map<number, number>> {
  if (userIds.length === 0) return new Map();

  const grouped = await prisma.transaction.groupBy({
    by: ["userId", "type"],
    where: { userId: { in: userIds } },
    _sum: { amount: true },
  });

  const balances = new Map<number, number>();
  for (const userId of userIds) {
    balances.set(userId, 0);
  }

  for (const row of grouped) {
    const current = balances.get(row.userId) ?? 0;
    const amount = row._sum.amount ?? 0;
    balances.set(row.userId, current + (row.type === "deposit" ? amount : -amount));
  }

  return balances;
}
