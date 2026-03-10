export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Projets PI</h1>
        <Link
          href="/projects/new"
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          Nouveau projet
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-3 py-2 text-left">Nom</th>
              <th className="border px-3 py-2 text-left">Code projet</th>
              <th className="border px-3 py-2 text-left">Ville</th>
              <th className="border px-3 py-2 text-left">Zone</th>
              <th className="border px-3 py-2 text-left">Segment</th>
              <th className="border px-3 py-2 text-left">Type</th>
              <th className="border px-3 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id}>
                <td className="border px-3 py-2">{project.name}</td>
                <td className="border px-3 py-2">{project.projectCode ?? "-"}</td>
                <td className="border px-3 py-2">{project.city ?? "-"}</td>
                <td className="border px-3 py-2">{project.zone ?? "-"}</td>
                <td className="border px-3 py-2">{project.segment ?? "-"}</td>
                <td className="border px-3 py-2">{project.type ?? "-"}</td>
                <td className="border px-3 py-2">
                  <div className="flex gap-3">
                    <Link
                      href={`/projects/${project.id}`}
                      className="text-blue-600 underline"
                    >
                      Ouvrir
                    </Link>
                    <Link
                      href={`/projects/${project.id}/evaluate`}
                      className="text-green-600 underline"
                    >
                      Évaluer
                    </Link>
                  </div>
                </td>
              </tr>
            ))}

            {projects.length === 0 && (
              <tr>
                <td colSpan={7} className="border px-3 py-4 text-center text-gray-500">
                  Aucun projet trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
