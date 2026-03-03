import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";

export default async function NewEvalPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) return <div>Projet introuvable.</div>;

  const mv = await prisma.modelVersion.findFirst({ where: { isActive: true }, orderBy: { createdAt: "desc" } });
  if (!mv) return <div>Aucun modèle actif.</div>;

  async function createEval(formData: FormData) {
    "use server";
    const inputs = {
      D1_FP_POS: formData.get("D1_FP_POS") === "on",
      D1_GEARING: Number(formData.get("D1_GEARING") || 0),
      D1_LIQ_GEN: Number(formData.get("D1_LIQ_GEN") || 0),

      D3_PREV_SEC: Number(formData.get("D3_PREV_SEC") || 0),
      D3_DSO: Number(formData.get("D3_DSO") || 0),
      D3_ROT_STOCK: Number(formData.get("D3_ROT_STOCK") || 0),
      D3_CASH_COV: Number(formData.get("D3_CASH_COV") || 0),

      D4_MB: Number(formData.get("D4_MB") || 0),
      D4_LTC: Number(formData.get("D4_LTC") || 0),
      D4_GAR_COV: Number(formData.get("D4_GAR_COV") || 0),
      D4_RANG_1: formData.get("D4_RANG_1") === "on",

      // triggers D5
      TRIG_RETARD_6M: formData.get("TRIG_RETARD_6M") === "on",
      TRIG_CASH_LT_2T: formData.get("TRIG_CASH_LT_2T") === "on",
      TRIG_IMPASSE_PERSIST: formData.get("TRIG_IMPASSE_PERSIST") === "on",
      HARD_IMPAYE_90D: formData.get("HARD_IMPAYE_90D") === "on",
    };

    const evalRow = await prisma.evaluation.create({
      data: {
        projectId: project.id,
        modelVersionId: mv.id,
        status: "DRAFT",
        inputs,
      },
    });

    // compute and store results via API-less server call
    const { loadActiveModel } = await import("@/lib/domain/loadModelFromDb");
    const { computePI } = await import("@/lib/domain/scoringEngine");
    const model = await loadActiveModel();
    const result = computePI(model, inputs, project.segmentCode, project.zoneCode);

    await prisma.evaluation.update({
      where: { id: evalRow.id },
      data: { results: result as any },
    });

    redirect(`/evaluations/${evalRow.id}`);
  }

  return (
    <div>
      <h2>Nouvelle évaluation — {project.projectRef}</h2>
      <p style={{ opacity: .8 }}>Segment={project.segmentCode} | Zone={project.zoneCode} | Promoteur={project.promoterType}</p>

      <form action={createEval} style={{ display: "grid", gap: 12, maxWidth: 720 }}>
        <fieldset style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
          <legend><b>D1 — Promoteur</b></legend>
          <label><input type="checkbox" name="D1_FP_POS" defaultChecked /> Fonds propres positifs</label>
          <label>Gearing (%) <input type="number" step="0.01" name="D1_GEARING" defaultValue={95} /></label>
          <label>Liquidité générale (x) <input type="number" step="0.01" name="D1_LIQ_GEN" defaultValue={1.25} /></label>
        </fieldset>

        <fieldset style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
          <legend><b>D3 — Commercial & Cash</b></legend>
          <label>Préventes sécurisées (%) <input type="number" step="0.01" name="D3_PREV_SEC" defaultValue={42} /></label>
          <label>DSO (jours) <input type="number" step="1" name="D3_DSO" defaultValue={110} /></label>
          <label>Rotation stock (jours) <input type="number" step="1" name="D3_ROT_STOCK" defaultValue={500} /></label>
          <label>Cash coverage (x) <input type="number" step="0.01" name="D3_CASH_COV" defaultValue={1.1} /></label>
        </fieldset>

        <fieldset style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
          <legend><b>D4 — LGD & Structuration</b></legend>
          <label>Marge brute (%) <input type="number" step="0.01" name="D4_MB" defaultValue={26} /></label>
          <label>LTC (%) <input type="number" step="0.01" name="D4_LTC" defaultValue={58} /></label>
          <label>Couverture garanties (%) <input type="number" step="0.01" name="D4_GAR_COV" defaultValue={125} /></label>
          <label><input type="checkbox" name="D4_RANG_1" defaultChecked /> Garantie 1er rang</label>
        </fieldset>

        <fieldset style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
          <legend><b>D5 — Déclencheurs / signaux</b></legend>
          <label><input type="checkbox" name="TRIG_RETARD_6M" /> Retard ≥6 mois</label>
          <label><input type="checkbox" name="TRIG_CASH_LT_2T" /> Cash &lt; échéances 2 trimestres</label>
          <label><input type="checkbox" name="TRIG_IMPASSE_PERSIST" /> Impasse persistante</label>
          <label><input type="checkbox" name="HARD_IMPAYE_90D" /> Impayé ≥90 jours (Souffrance)</label>
        </fieldset>

        <button type="submit">Calculer & enregistrer</button>
      </form>
    </div>
  );
}
