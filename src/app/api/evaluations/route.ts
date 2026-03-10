export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const evaluations = await prisma.evaluation.findMany({
    include: {
      project: true,
      modelVersion: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(evaluations);
}
