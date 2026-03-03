import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const evals = await prisma.evaluation.findMany({ orderBy: { dateScoring: "desc" }, take: 100 });
  return Response.json(evals);
}
