import { prisma } from "@/lib/db/prisma";

export default async function EvaluationsPage() {
  const evals = await prisma.evaluation.findMany({
    orderBy: { dateScoring: "desc" },
    take: 50,
    include: { project: true }
  });

  return (
    <div>
      <h2>Évaluations</h2>
      <div style={{ border: "1px solid #eee", borderRadius: 8 }}>
        {evals.map(e => (
          <div key={e.id} style={{ padding: 12, borderTop: "1px solid #eee" }}>
            <div style={{ fontWeight: 700 }}>
              <a href={`/evaluations/${e.id}`}>{e.project.projectRef} — {e.project.name}</a>
            </div>
            <div style={{ opacity: .8 }}>
              {new Date(e.dateScoring).toLocaleDateString("fr-FR")} | {e.status}
            </div>
          </div>
        ))}
        {evals.length === 0 && <div style={{ padding: 12 }}>Aucune évaluation.</div>}
      </div>
    </div>
  );
}
