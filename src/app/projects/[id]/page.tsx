export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      evaluations: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/projects" className="text-blue-600 underline">
          ← Retour à la liste des projets
        </Link>

        <Link
          href={`/projects/${project.id}/evaluate`}
          className="rounded bg-green-600 px-4 py-2 text-white"
        >
          Nouvelle évaluation
        </Link>
      </div>

      <h1 className="text-2xl font-bold">{project.name}</h1>

      <section className="border rounded p-4 space-y-2">
        <h2 className="text-lg font-semibold">Informations projet</h2>
        <p><strong>Code projet :</strong> {project.projectCode ?? "-"}</p>
        <p><strong>Ville :</strong> {project.city ?? "-"}</p>
        <p><strong>Zone :</strong> {project.zone ?? "-"}</p>
        <p><strong>Segment :</strong> {project.segment ?? "-"}</p>
        <p><strong>Type :</strong> {project.type ?? "-"}</p>
        <p><strong>Devise :</strong> {project.currency ?? "-"}</p>
        <p>
          <strong>Coût total :</strong>{" "}
          {project.totalCost ? Number(project.totalCost).toLocaleString() : "-"}
        </p>
        <p>
          <strong>Montant financement :</strong>{" "}
          {project.financingAmount ? Number(project.financingAmount).toLocaleString() : "-"}
        </p>
      </section>

      <section className="border rounded p-4">
        <h2 className="text-lg font-semibold mb-3">Historique des évaluations</h2>

        {project.evaluations.length === 0 ? (
          <p className="text-gray-500">Aucune évaluation pour ce projet.</p>
        ) : (
          <table className="min-w-full border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-3 py-2 text-left">Date</th>
                <th className="border px-3 py-2 text-left">Version modèle</th>
                <th className="border px-3 py-2 text-left">Score final</th>
                <th className="border px-3 py-2 text-left">Grade</th>
                <th className="border px-3 py-2 text-left">Statut</th>
                <th className="border px-3 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {project.evaluations.map((evaluation) => (
                <tr key={evaluation.id}>
                  <td className="border px-3 py-2">
                    {new Date(evaluation.createdAt).toLocaleDateString()}
                  </td>
                  <td className="border px-3 py-2">{evaluation.modelCode}</td>
                  <td className="border px-3 py-2">
                    {evaluation.finalScore ? Number(evaluation.finalScore).toFixed(2) : "-"}
                  </td>
                  <td className="border px-3 py-2">{evaluation.grade ?? "-"}</td>
                  <td className="border px-3 py-2">{evaluation.status}</td>
                  <td className="border px-3 py-2">
                    <Link
                      href={`/evaluations/${evaluation.id}`}
                      className="text-blue-600 underline"
                    >
                      Ouvrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
