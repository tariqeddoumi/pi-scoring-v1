export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { loadModelFromDb } from "@/lib/domain/loadModelFromDb";

export async function GET() {
  const model = await loadModelFromDb("PI_2026Q1");
  return NextResponse.json(model);
}
