export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

export default async function EvaluationsPage() {
  const evaluations = await prisma.evaluation.findMany({
    include: {
      project: true,
      modelVersion: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Évaluations</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-3 py-2 text-left">Projet</th>
              <th className="border px-3 py-2 text-left">Code projet</th>
              <th className="border px-3 py-2 text-left">Modèle</th>
              <th className="border px-3 py-2 text-left">Score final</th>
              <th className="border px-3 py-2 text-left">Grade</th>
              <th className="border px-3 py-2 text-left">Statut</th>
              <th className="border px-3 py-2 text-left">Date</th>
              <th className="border px-3 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {evaluations.map((evaluation) => (
              <tr key={evaluation.id}>
                <td className="border px-3 py-2">{evaluation.project.name}</td>
                <td className="border px-3 py-2">{evaluation.project.projectCode ?? "-"}</td>
                <td className="border px-3 py-2">{evaluation.modelVersion.code}</td>
                <td className="border px-3 py-2">
                  {evaluation.finalScore ? Number(evaluation.finalScore).toFixed(2) : "-"}
                </td>
                <td className="border px-3 py-2">{evaluation.grade ?? "-"}</td>
                <td className="border px-3 py-2">{evaluation.status}</td>
                <td className="border px-3 py-2">
                  {new Date(evaluation.createdAt).toLocaleDateString()}
                </td>
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

            {evaluations.length === 0 && (
              <tr>
                <td colSpan={8} className="border px-3 py-4 text-center text-gray-500">
                  Aucune évaluation trouvée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
