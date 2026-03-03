import { prisma } from "@/lib/db/prisma";

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { evaluations: { orderBy: { dateScoring: "desc" }, take: 10 } }
  });

  if (!project) return <div>Projet introuvable.</div>;

  return (
    <div>
      <h2>{project.projectRef} — {project.name}</h2>
      <p style={{ opacity: .8 }}>{project.city} | zone={project.zoneCode} | segment={project.segmentCode} | promoteur={project.promoterType}</p>

      <div style={{ display: "flex", gap: 10 }}>
        <a href={`/projects/${project.id}/evaluate`}>+ Nouvelle évaluation</a>
      </div>

      <h3 style={{ marginTop: 18 }}>Dernières évaluations</h3>
      <div style={{ border: "1px solid #eee", borderRadius: 8 }}>
        {project.evaluations.map(e => (
          <div key={e.id} style={{ padding: 12, borderTop: "1px solid #eee" }}>
            <div><b>{new Date(e.dateScoring).toLocaleDateString("fr-FR")}</b> — {e.status}</div>
            <div style={{ marginTop: 6, display: "flex", gap: 10 }}>
              <a href={`/evaluations/${e.id}`}>Résultats</a>
            </div>
          </div>
        ))}
        {project.evaluations.length === 0 && <div style={{ padding: 12 }}>Aucune évaluation.</div>}
      </div>
    </div>
  );
}
