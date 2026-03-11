export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const projectsCount = await prisma.project.count();
    const evaluationsCount = await prisma.evaluation.count();

    return NextResponse.json({
      ok: true,
      projectsCount,
      evaluationsCount,
    });
  } catch (error) {
    console.error("DB health error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
