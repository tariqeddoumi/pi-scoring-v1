import { prisma } from "@/lib/db/prisma";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({ orderBy: { updatedAt: "desc" } });

  return (
    <div>
      <h2>Projets</h2>
      <a href="/projects/new">+ Nouveau projet</a>
      <div style={{ marginTop: 12, border: "1px solid #eee", borderRadius: 8 }}>
        {projects.map(p => (
          <div key={p.id} style={{ padding: 12, borderTop: "1px solid #eee" }}>
            <div style={{ fontWeight: 700 }}>{p.projectRef} — {p.name}</div>
            <div style={{ opacity: .8 }}>{p.city} | zone={p.zoneCode} | segment={p.segmentCode} | promoteur={p.promoterType}</div>
            <div style={{ marginTop: 8, display: "flex", gap: 10 }}>
              <a href={`/projects/${p.id}`}>Ouvrir</a>
              <a href={`/projects/${p.id}/evaluate`}>Créer évaluation</a>
            </div>
          </div>
        ))}
        {projects.length === 0 && <div style={{ padding: 12 }}>Aucun projet pour l’instant.</div>}
      </div>
    </div>
  );
}
