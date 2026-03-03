import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const projects = await prisma.project.findMany({ orderBy: { updatedAt: "desc" } });
  return Response.json(projects);
}
