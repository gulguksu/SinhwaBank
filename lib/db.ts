import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

/**
 * Vercel 서버리스에서는 요청마다 새 인스턴스가 뜰 수 있어 DB 연결이 느려질 수 있습니다.
 * Neon, Supabase, PlanetScale 등은 'Connection Pooler' URL을 제공합니다.
 * Vercel 배포 시 DATABASE_URL에 풀러 URL(예: ?pgbouncer=true 또는 풀러 전용 호스트)을
 * 사용하면 Cold Start 시 연결 지연을 줄일 수 있습니다.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

