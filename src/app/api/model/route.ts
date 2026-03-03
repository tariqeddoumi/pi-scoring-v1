import { loadActiveModel } from "@/lib/domain/loadModelFromDb";

export async function GET() {
  const model = await loadActiveModel();
  return Response.json(model);
}
