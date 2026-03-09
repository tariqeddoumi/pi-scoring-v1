import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { loadModelFromDb } from "@/lib/domain/loadModelFromDb";
import { computeScoring } from "@/lib/domain/scoringEngine";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectEvaluatePage({ params }: PageProps) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
  });

  if (!project) {
    notFound();
  }

  async function submitEvaluation(formData: FormData) {
    "use server";

    const projectId = formData.get("projectId")?.toString();
    const modelCode = formData.get("modelCode")?.toString() || "PI_2026Q1";

    if (!projectId) {
      throw new Error("Project ID manquant.");
    }

    const inputs = {
      preCommercialisationPct: Number(formData.get("preCommercialisationPct") || 0),
      workProgressPct: Number(formData.get("workProgressPct") || 0),
      dscr: Number(formData.get("dscr") || 0),
      segment: formData.get("segment")?.toString() || "",
      zone: formData.get("zone")?.toString() || "",
      d5Triggers: [],
    };

    const model = await loadModelFromDb(modelCode);
    const scoring = computeScoring({
      model,
      inputs,
    });

    const evaluation = await prisma.evaluation.create({
      data: {
        projectId,
        modelCode,
        status: "draft",
        inputs,
        results: scoring,
        finalScore: scoring.finalScore,
        grade: scoring.grade,
      },
    });

    redirect(`/evaluations/${evaluation.id}`);
  }

  return (
    <main className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Nouvelle évaluation PI</h1>

      <div className="mb-6 border rounded p-4 space-y-2">
        <p><strong>Projet :</strong> {project.name}</p>
        <p><strong>Code projet :</strong> {project.projectCode ?? "-"}</p>
        <p><strong>Ville :</strong> {project.city ?? "-"}</p>
        <p><strong>Zone :</strong> {project.zone ?? "-"}</p>
        <p><strong>Segment :</strong> {project.segment ?? "-"}</p>
        <p><strong>Type :</strong> {project.type ?? "-"}</p>
      </div>

      <form action={submitEvaluation} className="space-y-4">
        <input type="hidden" name="projectId" value={project.id} />
        <input type="hidden" name="modelCode" value="PI_2026Q1" />
        <input type="hidden" name="segment" value={project.segment ?? ""} />
        <input type="hidden" name="zone" value={project.zone ?? ""} />

        <div>
          <label className="block mb-1 font-medium">Précommercialisation (%)</label>
          <input
            name="preCommercialisationPct"
            type="number"
            step="0.01"
            className="w-full border rounded px-3 py-2"
            defaultValue="0"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Avancement travaux (%)</label>
          <input
            name="workProgressPct"
            type="number"
            step="0.01"
            className="w-full border rounded px-3 py-2"
            defaultValue="0"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">DSCR</label>
          <input
            name="dscr"
            type="number"
            step="0.01"
            className="w-full border rounded px-3 py-2"
            defaultValue="0"
          />
        </div>

        <button type="submit" className="rounded bg-green-600 px-4 py-2 text-white">
          Calculer et enregistrer
        </button>
      </form>
    </main>
  );
}
