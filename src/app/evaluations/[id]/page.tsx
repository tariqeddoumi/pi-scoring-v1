export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EvaluationDetailPage({ params }: PageProps) {
  const { id } = await params;

  const evaluation = await prisma.evaluation.findUnique({
    where: { id },
    include: {
      project: true,
      modelVersion: true,
    },
  });

  if (!evaluation) {
    notFound();
  }

  return (
    <main className="p-6 space-y-6">
      <div>
        <Link href="/evaluations" className="text-blue-600 underline">
          ← Retour à la liste des évaluations
        </Link>
      </div>

      <h1 className="text-2xl font-bold">Détail évaluation</h1>

      <section className="border rounded p-4 space-y-2">
        <h2 className="text-lg font-semibold">Informations générales</h2>
        <p><strong>ID évaluation :</strong> {evaluation.id}</p>
        <p><strong>Projet :</strong> {evaluation.project.name}</p>
        <p><strong>Code projet :</strong> {evaluation.project.projectCode ?? "-"}</p>
        <p><strong>Ville :</strong> {evaluation.project.city ?? "-"}</p>
        <p><strong>Zone :</strong> {evaluation.project.zone ?? "-"}</p>
        <p><strong>Segment :</strong> {evaluation.project.segment ?? "-"}</p>
        <p><strong>Type :</strong> {evaluation.project.type ?? "-"}</p>
        <p><strong>Version modèle :</strong> {evaluation.modelVersion.code}</p>
        <p><strong>Statut :</strong> {evaluation.status}</p>
        <p>
          <strong>Date évaluation :</strong>{" "}
          {new Date(evaluation.createdAt).toLocaleString()}
        </p>
      </section>

      <section className="border rounded p-4 space-y-2">
        <h2 className="text-lg font-semibold">Résultat</h2>
        <p>
          <strong>Score final :</strong>{" "}
          {evaluation.finalScore ? Number(evaluation.finalScore).toFixed(2) : "-"}
        </p>
        <p><strong>Grade :</strong> {evaluation.grade ?? "-"}</p>
      </section>

      <section className="border rounded p-4 space-y-2">
        <h2 className="text-lg font-semibold">Inputs</h2>
        <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">
          {JSON.stringify(evaluation.inputs, null, 2)}
        </pre>
      </section>

      <section className="border rounded p-4 space-y-2">
        <h2 className="text-lg font-semibold">Résultats détaillés</h2>
        <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">
          {JSON.stringify(evaluation.results, null, 2)}
        </pre>
      </section>
    </main>
  );
}
