import { PrismaClient, KpiStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const mv = await prisma.modelVersion.upsert({
    where: { code: "PI_2026_V1" },
    update: { isActive: true },
    create: { code: "PI_2026_V1", label: "Modèle Scoring Promotion Immobilière — 2026" },
  });

  const domains = await Promise.all([
    prisma.domain.upsert({
      where: { modelVersionId_code: { modelVersionId: mv.id, code: "D1" } },
      update: { weight: 0.22, label: "Sponsor & Gouvernance" },
      create: { modelVersionId: mv.id, code: "D1", label: "Sponsor & Gouvernance", weight: 0.22 },
    }),
    prisma.domain.upsert({
      where: { modelVersionId_code: { modelVersionId: mv.id, code: "D2" } },
      update: { weight: 0.18, label: "Qualité intrinsèque du projet" },
      create: { modelVersionId: mv.id, code: "D2", label: "Qualité intrinsèque du projet", weight: 0.18 },
    }),
    prisma.domain.upsert({
      where: { modelVersionId_code: { modelVersionId: mv.id, code: "D3" } },
      update: { weight: 0.28, label: "Commercial & Cash-Flow" },
      create: { modelVersionId: mv.id, code: "D3", label: "Commercial & Cash-Flow", weight: 0.28 },
    }),
    prisma.domain.upsert({
      where: { modelVersionId_code: { modelVersionId: mv.id, code: "D4" } },
      update: { weight: 0.22, label: "Structuration & LGD" },
      create: { modelVersionId: mv.id, code: "D4", label: "Structuration & LGD", weight: 0.22 },
    }),
  ]);

  const d = Object.fromEntries(domains.map(x => [x.code, x]));

  // Segments (αSeg)
  await prisma.segment.createMany({
    data: [
      { modelVersionId: mv.id, code: "STRUCT_NAT", label: "Promoteur structuré national", alpha: 0.02 },
      { modelVersionId: mv.id, code: "REGIONAL", label: "Promoteur régional", alpha: 0.0 },
      { modelVersionId: mv.id, code: "OPPORTUNISTE", label: "Opportuniste / mono-projet", alpha: -0.05 },
    ],
    skipDuplicates: true,
  });

  // Zones (βZone) — valeurs d'exemple (à calibrer)
  await prisma.zone.createMany({
    data: [
      { modelVersionId: mv.id, code: "CASA_CORE", label: "Casablanca - cœur", beta: 0.01 },
      { modelVersionId: mv.id, code: "CASA_PERIPH", label: "Casablanca - périphérie", beta: -0.01 },
      { modelVersionId: mv.id, code: "MARRAKECH", label: "Marrakech", beta: 0.0 },
      { modelVersionId: mv.id, code: "AUTRES", label: "Autres villes", beta: 0.0 },
    ],
    skipDuplicates: true,
  });

  // KPI (subset starter) — extensible
  const kpis = [
    // D1.2 Solidité financière promoteur
    { code: "D1_FP_POS", label: "Fonds propres positifs", domain: "D1", direction: "boolean", unit: "", weight: 1, sourceHint: "Bilans certifiés" },
    { code: "D1_GEARING", label: "Gearing global (Dettes nettes / FP)", domain: "D1", direction: "lower_is_better", unit: "%", weight: 1, sourceHint: "Bilans certifiés" },
    { code: "D1_LIQ_GEN", label: "Liquidité générale (Actif CT / Passif CT)", domain: "D1", direction: "higher_is_better", unit: "x", weight: 1, sourceHint: "Bilans certifiés" },

    // D3.1 Préventes sécurisées
    { code: "D3_PREV_SEC", label: "Préventes sécurisées (Ventes fermes encaissées / CA total)", domain: "D3", direction: "higher_is_better", unit: "%", weight: 1.5, sourceHint: "Etat ventes + relevés" },
    { code: "D3_DSO", label: "DSO (Créances/CA×360)", domain: "D3", direction: "lower_is_better", unit: "jours", weight: 1.2, sourceHint: "Balance âgée" },
    { code: "D3_ROT_STOCK", label: "Rotation stock (Stock/CA×360)", domain: "D3", direction: "lower_is_better", unit: "jours", weight: 1.0, sourceHint: "Inventaire" },
    { code: "D3_CASH_COV", label: "Cash coverage (Cash dispo / échéances)", domain: "D3", direction: "higher_is_better", unit: "x", weight: 1.2, sourceHint: "Echéancier" },

    // D4 rentabilité / LGD
    { code: "D4_MB", label: "Marge brute ((CA - coûts directs)/CA)", domain: "D4", direction: "higher_is_better", unit: "%", weight: 1.2, sourceHint: "BP + réalisés" },
    { code: "D4_LTC", label: "LTC (Dette / coût total)", domain: "D4", direction: "lower_is_better", unit: "%", weight: 1.0, sourceHint: "Term sheet" },
    { code: "D4_GAR_COV", label: "Couverture garanties (Valeur réalisable / exposition)", domain: "D4", direction: "higher_is_better", unit: "%", weight: 1.0, sourceHint: "Garanties" },
    { code: "D4_RANG_1", label: "Rang bancaire 1er rang", domain: "D4", direction: "boolean", unit: "", weight: 1.0, sourceHint: "Actes" },
  ];

  for (const k of kpis) {
    const created = await prisma.kpi.upsert({
      where: { modelVersionId_code: { modelVersionId: mv.id, code: k.code } },
      update: { label: k.label, domainId: d[k.domain].id, direction: k.direction, unit: k.unit, weight: k.weight, sourceHint: k.sourceHint },
      create: { modelVersionId: mv.id, domainId: d[k.domain].id, code: k.code, label: k.label, direction: k.direction, unit: k.unit, weight: k.weight, sourceHint: k.sourceHint },
    });

    // thresholds
    await prisma.kpiThreshold.deleteMany({ where: { kpiId: created.id } });

    // Generic thresholds based on the doc
    switch (k.code) {
      case "D1_FP_POS":
        await prisma.kpiThreshold.createMany({
          data: [
            { kpiId: created.id, status: KpiStatus.OK }, // true handled in engine
            { kpiId: created.id, status: KpiStatus.CRIT },
          ],
        });
        break;
      case "D1_GEARING":
        await prisma.kpiThreshold.createMany({
          data: [
            { kpiId: created.id, status: KpiStatus.OK, maxValue: 100 },
            { kpiId: created.id, status: KpiStatus.VIG, minValue: 100, maxValue: 150 },
            { kpiId: created.id, status: KpiStatus.CRIT, minValue: 150 },
          ],
        });
        break;
      case "D1_LIQ_GEN":
        await prisma.kpiThreshold.createMany({
          data: [
            { kpiId: created.id, status: KpiStatus.OK, minValue: 1.2 },
            { kpiId: created.id, status: KpiStatus.VIG, minValue: 1.0, maxValue: 1.2 },
            { kpiId: created.id, status: KpiStatus.CRIT, maxValue: 1.0 },
          ],
        });
        break;
      case "D3_PREV_SEC":
        await prisma.kpiThreshold.createMany({
          data: [
            { kpiId: created.id, status: KpiStatus.OK, minValue: 40 },
            { kpiId: created.id, status: KpiStatus.VIG, minValue: 25, maxValue: 40 },
            { kpiId: created.id, status: KpiStatus.CRIT, maxValue: 25 },
            // Example segment overrides (document: Intermédiaire >=50%, Touristique >=55% etc.)
            { kpiId: created.id, status: KpiStatus.OK, minValue: 50, segmentCode: "INTERMEDIAIRE" },
            { kpiId: created.id, status: KpiStatus.OK, minValue: 55, segmentCode: "TOURISTIQUE" },
            { kpiId: created.id, status: KpiStatus.OK, minValue: 50, segmentCode: "INTERMEDIAIRE", zoneCode: "CASA_PERIPH" },
          ],
        });
        break;
      case "D3_DSO":
        await prisma.kpiThreshold.createMany({
          data: [
            { kpiId: created.id, status: KpiStatus.OK, maxValue: 120 },
            { kpiId: created.id, status: KpiStatus.VIG, minValue: 120, maxValue: 240 },
            { kpiId: created.id, status: KpiStatus.CRIT, minValue: 240 },
          ],
        });
        break;
      case "D3_ROT_STOCK":
        // 18m/30m expressed in days approx
        await prisma.kpiThreshold.createMany({
          data: [
            { kpiId: created.id, status: KpiStatus.OK, maxValue: 540 },
            { kpiId: created.id, status: KpiStatus.VIG, minValue: 540, maxValue: 900 },
            { kpiId: created.id, status: KpiStatus.CRIT, minValue: 900 },
            { kpiId: created.id, status: KpiStatus.CRIT, minValue: 720, zoneCode: "CASA_PERIPH" },
          ],
        });
        break;
      case "D3_CASH_COV":
        await prisma.kpiThreshold.createMany({
          data: [
            { kpiId: created.id, status: KpiStatus.OK, minValue: 1.2 },
            { kpiId: created.id, status: KpiStatus.VIG, minValue: 1.0, maxValue: 1.2 },
            { kpiId: created.id, status: KpiStatus.CRIT, maxValue: 1.0 },
          ],
        });
        break;
      case "D4_MB":
        await prisma.kpiThreshold.createMany({
          data: [
            { kpiId: created.id, status: KpiStatus.OK, minValue: 25 },
            { kpiId: created.id, status: KpiStatus.VIG, minValue: 15, maxValue: 25 },
            { kpiId: created.id, status: KpiStatus.CRIT, maxValue: 15 },
          ],
        });
        break;
      case "D4_LTC":
        await prisma.kpiThreshold.createMany({
          data: [
            { kpiId: created.id, status: KpiStatus.OK, maxValue: 60 },
            { kpiId: created.id, status: KpiStatus.VIG, minValue: 60, maxValue: 80 },
            { kpiId: created.id, status: KpiStatus.CRIT, minValue: 80 },
          ],
        });
        break;
      case "D4_GAR_COV":
        await prisma.kpiThreshold.createMany({
          data: [
            { kpiId: created.id, status: KpiStatus.OK, minValue: 120 },
            { kpiId: created.id, status: KpiStatus.VIG, minValue: 90, maxValue: 120 },
            { kpiId: created.id, status: KpiStatus.CRIT, maxValue: 90 },
          ],
        });
        break;
      case "D4_RANG_1":
        await prisma.kpiThreshold.createMany({
          data: [
            { kpiId: created.id, status: KpiStatus.OK },
            { kpiId: created.id, status: KpiStatus.CRIT },
          ],
        });
        break;
    }
  }

  // D5 triggers (malus)
  await prisma.triggerRule.createMany({
    data: [
      { modelVersionId: mv.id, code: "D5_VIG_3", label: "≥3 KPI en vigilance", malus: 10 },
      { modelVersionId: mv.id, code: "D5_CRIT_3", label: "≥3 KPI critiques", malus: 25 },
      { modelVersionId: mv.id, code: "TRIG_RETARD_6M", label: "Retard ≥6 mois", malus: 15 },
      { modelVersionId: mv.id, code: "TRIG_CASH_LT_2T", label: "Cash < échéances 2 trimestres", malus: 25 },
      { modelVersionId: mv.id, code: "TRIG_IMPASSE_PERSIST", label: "Impasse persistante", malus: 20 },
      { modelVersionId: mv.id, code: "TRIG_RESTRUCT_1", label: "1ère restructuration", malus: 25 },
      { modelVersionId: mv.id, code: "TRIG_FP_NEG", label: "FP négatifs", malus: 25 },
      { modelVersionId: mv.id, code: "TRIG_RANG_NOT_1", label: "Garantie non 1er rang", malus: 25 },
      // hard triggers -> Souffrance
      { modelVersionId: mv.id, code: "HARD_IMPAYE_90D", label: "Impayé ≥90 jours", malus: 0, isHardTrigger: true },
      { modelVersionId: mv.id, code: "HARD_ARRET_12M", label: "Projet arrêté ≥12 mois", malus: 0, isHardTrigger: true },
      { modelVersionId: mv.id, code: "HARD_NRP", label: "Non-remboursement probable", malus: 0, isHardTrigger: true },
      { modelVersionId: mv.id, code: "HARD_RESTRUCT_PERTE", label: "Restructuration avec perte", malus: 0, isHardTrigger: true },
    ],
    skipDuplicates: true,
  });

  // Sample project + evaluation
  const project = await prisma.project.upsert({
    where: { projectRef: "PI0001" },
    update: {},
    create: {
      projectRef: "PI0001",
      name: "Résidence Atlas",
      city: "Casablanca",
      zoneCode: "CASA_CORE",
      segmentCode: "INTERMEDIAIRE",
      promoterType: "STRUCT_NAT",
    },
  });

  await prisma.evaluation.create({
    data: {
      projectId: project.id,
      modelVersionId: mv.id,
      status: "DRAFT",
      inputs: {
        // subset inputs used by starter KPI set
        D1_FP_POS: true,
        D1_GEARING: 95,
        D1_LIQ_GEN: 1.25,
        D3_PREV_SEC: 42,
        D3_DSO: 110,
        D3_ROT_STOCK: 500,
        D3_CASH_COV: 1.1,
        D4_MB: 26,
        D4_LTC: 58,
        D4_GAR_COV: 125,
        D4_RANG_1: true,

        // D5 triggers (booleans)
        TRIG_RETARD_6M: false,
        TRIG_CASH_LT_2T: false,
        TRIG_IMPASSE_PERSIST: false,
        HARD_IMPAYE_90D: false,
      },
    },
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
