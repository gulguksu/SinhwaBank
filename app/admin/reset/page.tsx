import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ResetAdminClient } from "./ResetAdminClient";

export default async function AdminResetPage() {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    redirect("/");
  }

  const students = await prisma.user.findMany({
    where: { isAdmin: false },
    orderBy: { id: "asc" },
    select: { id: true, name: true, username: true, job: true },
  });

  return <ResetAdminClient students={students} />;
}

