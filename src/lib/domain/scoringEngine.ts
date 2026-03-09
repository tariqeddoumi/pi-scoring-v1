type DomainResult = {
  code: string;
  score: number;
  weight: number;
};

type LoadedModel = {
  modelVersion: { code: string } | null;
  domainWeights: Array<{
    domainCode: string;
    weight: unknown;
  }>;
  kpis: Array<{
    domainCode: string;
    kpiCode: string;
  }>;
  thresholds: Array<{
    kpiCode: string;
    segment: string | null;
    zone: string | null;
    bandMin: unknown;
    bandMax: unknown;
    score: unknown;
  }>;
  segmentAdjustments: Array<{
    segment: string;
    alpha: unknown;
  }>;
  zoneAdjustments: Array<{
    zone: string;
    beta: unknown;
  }>;
  d5Triggers: Array<{
    triggerCode: string;
    severity: string;
    malus: unknown;
  }>;
};

type ScoringInputs = {
  preCommercialisationPct: number;
  workProgressPct: number;
  dscr: number;
  segment: string;
  zone: string;
  d5Triggers: string[];
};

type ComputeScoringArgs = {
  model: LoadedModel;
  inputs: ScoringInputs;
};

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function scoreFromThresholds(
  thresholds: LoadedModel["thresholds"],
  kpiCode: string,
  value: number,
  segment?: string,
  zone?: string
): number {
  const filtered = thresholds.filter((t) => {
    if (t.kpiCode !== kpiCode) return false;
    if (t.segment && segment && t.segment !== segment) return false;
    if (t.zone && zone && t.zone !== zone) return false;
    return true;
  });

  for (const t of filtered) {
    const min = t.bandMin === null ? -Infinity : toNumber(t.bandMin);
    const max = t.bandMax === null ? Infinity : toNumber(t.bandMax);

    if (value >= min && value < max) {
      return toNumber(t.score);
    }
  }

  return 0;
}

export function computeScoring({ model, inputs }: ComputeScoringArgs) {
  const d3Precom = scoreFromThresholds(
    model.thresholds,
    "D3.1.1",
    inputs.preCommercialisationPct,
    inputs.segment,
    inputs.zone
  );

  const d3Progress = scoreFromThresholds(
    model.thresholds,
    "D3.2.1",
    inputs.workProgressPct,
    inputs.segment,
    inputs.zone
  );

  const d4Dscr = scoreFromThresholds(
    model.thresholds,
    "D4.1.1",
    inputs.dscr,
    inputs.segment,
    inputs.zone
  );

  const domainResults: DomainResult[] = [];

  const d3Weight =
    toNumber(model.domainWeights.find((d) => d.domainCode === "D3")?.weight) || 0.28;
  const d4Weight =
    toNumber(model.domainWeights.find((d) => d.domainCode === "D4")?.weight) || 0.22;
  const d1Weight =
    toNumber(model.domainWeights.find((d) => d.domainCode === "D1")?.weight) || 0.22;
  const d2Weight =
    toNumber(model.domainWeights.find((d) => d.domainCode === "D2")?.weight) || 0.18;

  domainResults.push({
    code: "D1",
    score: 0,
    weight: d1Weight,
  });

  domainResults.push({
    code: "D2",
    score: 0,
    weight: d2Weight,
  });

  domainResults.push({
    code: "D3",
    score: (d3Precom + d3Progress) / 2,
    weight: d3Weight,
  });

  domainResults.push({
    code: "D4",
    score: d4Dscr,
    weight: d4Weight,
  });

  const sEco = domainResults.reduce((acc, item) => acc + item.score * item.weight, 0);

  const alpha =
    toNumber(
      model.segmentAdjustments.find((s) => s.segment === inputs.segment)?.alpha
    ) || 0;

  const beta =
    toNumber(model.zoneAdjustments.find((z) => z.zone === inputs.zone)?.beta) || 0;

  const triggeredMalus = model.d5Triggers
    .filter((t) => inputs.d5Triggers.includes(t.triggerCode))
    .reduce((acc, t) => acc + toNumber(t.malus), 0);

  const sAdj = sEco * (1 + alpha + beta);
  const finalScore = Math.max(0, sAdj - triggeredMalus);

  let grade = "D";
  if (finalScore >= 80) grade = "A";
  else if (finalScore >= 65) grade = "B";
  else if (finalScore >= 50) grade = "C";

  return {
    modelCode: model.modelVersion?.code ?? "PI_2026Q1",
    domainResults,
    alpha,
    beta,
    sEco,
    sAdj,
    malus: triggeredMalus,
    finalScore,
    grade,
  };
}
