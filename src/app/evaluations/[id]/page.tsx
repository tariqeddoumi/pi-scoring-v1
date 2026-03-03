import { prisma } from "@/lib/db/prisma";

export default async function EvaluationDetail({ params }: { params: { id: string } }) {
  const e = await prisma.evaluation.findUnique({
    where: { id: params.id },
    include: { project: true, modelVersion: true }
  });

  if (!e) return <div>Évaluation introuvable.</div>;

  const r = e.results as any;

  return (
    <div>
      <h2>Résultat — {e.project.projectRef}</h2>
      <p style={{ opacity: .8 }}>Modèle: {e.modelVersion.code} | Date: {new Date(e.dateScoring).toLocaleDateString("fr-FR")}</p>

      {!r && <div>Pas de résultats calculés.</div>}

      {r && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 12 }}>
            <KpiCard title="S_eco" value={r.sEco?.toFixed?.(1)} />
            <KpiCard title="S_adj" value={r.sAdj?.toFixed?.(1)} />
            <KpiCard title="Malus" value={r.malus?.toFixed?.(1)} />
            <KpiCard title="S_final" value={r.sFinal?.toFixed?.(1)} />
          </div>
          <div style={{ marginTop: 12, padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>Classification : {r.classification}</div>
            <div style={{ opacity: .8 }}>Segment={r.segmentCode} | Zone={r.zoneCode}</div>
          </div>

          <h3 style={{ marginTop: 18 }}>Détails par domaine</h3>
          {r.domainResults?.map((d: any) => (
            <div key={d.code} style={{ border: "1px solid #eee", borderRadius: 8, marginTop: 10 }}>
              <div style={{ padding: 12, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" }}>
                <b>{d.code} — {d.label}</b>
                <span>{d.score0to100?.toFixed?.(1)} / 100</span>
              </div>
              <div style={{ padding: 12 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>
                      <th>KPI</th><th>Valeur</th><th>Status</th><th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.kpis.map((k: any) => (
                      <tr key={k.code} style={{ borderBottom: "1px solid #f3f3f3" }}>
                        <td style={{ padding: "6px 0" }}>{k.label}</td>
                        <td>{String(k.value)}</td>
                        <td>{k.status}</td>
                        <td>{k.score0to5}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <h3 style={{ marginTop: 18 }}>Triggers / Malus</h3>
          <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
            {r.triggersFired?.length ? (
              <ul>
                {r.triggersFired.map((t: any) => (
                  <li key={t.code}>
                    {t.label} — malus {t.malus}{t.hard ? " (hard)" : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <div>Aucun trigger.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ title, value }: { title: string; value: string }) {
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
      <div style={{ opacity: .7 }}>{title}</div>
      <div style={{ fontWeight: 800, fontSize: 22 }}>{value}</div>
    </div>
  );
}
