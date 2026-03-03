import { DomainResult, FinalResult, KpiDef, KpiResult, ModelBundle, Threshold } from "./model";

function pickThreshold(thresholds: Threshold[], status: "OK"|"VIG"|"CRIT", segmentCode: string, zoneCode: string) {
  const candidates = thresholds.filter(t => t.status === status);
  const best = candidates.find(t => t.segmentCode === segmentCode && t.zoneCode === zoneCode)
    ?? candidates.find(t => t.segmentCode === segmentCode && !t.zoneCode)
    ?? candidates.find(t => !t.segmentCode && t.zoneCode === zoneCode)
    ?? candidates.find(t => !t.segmentCode && !t.zoneCode);
  return best ?? null;
}

function evaluateStatus(kpi: KpiDef, raw: unknown, segmentCode: string, zoneCode: string): {status:"OK"|"VIG"|"CRIT", applied: any} {
  // boolean KPI
  if (kpi.direction === "boolean") {
    const v = !!raw;
    return { status: v ? "OK" : "CRIT", applied: null };
  }

  const value = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(value)) return { status: "CRIT", applied: null };

  // For higher_is_better:
  // OK if value >= OK.min
  // VIG if between VIG range
  // CRIT otherwise
  if (kpi.direction === "higher_is_better") {
    const tOK = pickThreshold(kpi.thresholds, "OK", segmentCode, zoneCode);
    const tV = pickThreshold(kpi.thresholds, "VIG", segmentCode, zoneCode);
    const tC = pickThreshold(kpi.thresholds, "CRIT", segmentCode, zoneCode);

    if (tOK?.minValue != null && value >= tOK.minValue) return { status: "OK", applied: tOK };
    if (tV && ((tV.minValue ?? -Infinity) <= value) && (value < (tV.maxValue ?? Infinity))) return { status: "VIG", applied: tV };
    if (tC?.maxValue != null && value <= tC.maxValue) return { status: "CRIT", applied: tC };
    // fallback
    return { status: value >= (tV?.minValue ?? 0) ? "VIG" : "CRIT", applied: tV ?? tC };
  }

  // lower_is_better
  const tOK = pickThreshold(kpi.thresholds, "OK", segmentCode, zoneCode);
  const tV = pickThreshold(kpi.thresholds, "VIG", segmentCode, zoneCode);
  const tC = pickThreshold(kpi.thresholds, "CRIT", segmentCode, zoneCode);

  if (tOK?.maxValue != null && value <= tOK.maxValue) return { status: "OK", applied: tOK };
  if (tV && ((tV.minValue ?? -Infinity) <= value) && (value < (tV.maxValue ?? Infinity))) return { status: "VIG", applied: tV };
  if (tC?.minValue != null && value >= tC.minValue) return { status: "CRIT", applied: tC };
  return { status: value <= (tV?.maxValue ?? value) ? "VIG" : "CRIT", applied: tV ?? tC };
}

function statusToScore0to5(status: "OK"|"VIG"|"CRIT") {
  // simple mapping (industrialisation: you can make it more granular)
  if (status === "OK") return 5;
  if (status === "VIG") return 3;
  return 0;
}

function weightedAvg01(items: {score01:number, w:number}[]) {
  const W = items.reduce((a,x)=>a+x.w,0);
  if (W <= 0) return 0;
  return items.reduce((a,x)=>a + x.score01*x.w,0) / W;
}

export function computePI(model: ModelBundle, input: Record<string, unknown>, segmentCode: string, zoneCode: string): FinalResult {
  const domainResults: DomainResult[] = [];
  const allKpiResults: KpiResult[] = [];

  for (const dom of model.domains) {
    const kpis = model.kpis.filter(k => k.domainCode === dom.code);
    const res: KpiResult[] = kpis.map(k => {
      const value = input[k.code];
      const {status, applied} = evaluateStatus(k, value, segmentCode, zoneCode);
      const score0to5 = statusToScore0to5(status);
      const r: KpiResult = {
        code: k.code, label: k.label, value,
        status, score0to5, weight: k.weight,
        appliedThreshold: applied ? { min: applied.minValue ?? null, max: applied.maxValue ?? null, segment: applied.segmentCode ?? null, zone: applied.zoneCode ?? null } : null
      };
      allKpiResults.push(r);
      return r;
    });

    const domScore01 = weightedAvg01(res.map(r => ({score01: r.score0to5/5, w: r.weight})));
    domainResults.push({
      code: dom.code,
      label: dom.label,
      score0to1: domScore01,
      score0to100: domScore01*100,
      kpis: res,
    });
  }

  // S_eco = Σ Wi * S_Di
  const sEco01 = weightedAvg01(domainResults.map(d => ({score01: d.score0to1, w: d.weight})));
  const sEco = sEco01 * 100;

  // αSeg + βZone
  const alpha = model.alphaSeg[segmentCode] ?? 0;
  const beta = model.betaZone[zoneCode] ?? 0;
  const sAdj = Math.max(0, Math.min(100, sEco * (1 + alpha + beta)));

  // D5 malus (rules)
  const vigCount = allKpiResults.filter(r => r.status === "VIG").length;
  const critCount = allKpiResults.filter(r => r.status === "CRIT").length;

  let malus = 0;
  const triggersFired: {code:string; label:string; malus:number; hard:boolean}[] = [];

  // rule: >=3 vig => -10 ; >=3 crit => -25
  if (vigCount >= 3) {
    const t = model.triggers.find(x => x.code === "D5_VIG_3");
    if (t) { malus += t.malus; triggersFired.push({code:t.code,label:t.label,malus:t.malus,hard:false}); }
  }
  if (critCount >= 3) {
    const t = model.triggers.find(x => x.code === "D5_CRIT_3");
    if (t) { malus += t.malus; triggersFired.push({code:t.code,label:t.label,malus:t.malus,hard:false}); }
  }

  // explicit triggers booleans in input
  for (const t of model.triggers) {
    if (t.code.startsWith("D5_")) continue;
    const flag = !!input[t.code];
    if (flag) {
      triggersFired.push({code:t.code,label:t.label,malus:t.malus,hard:t.isHardTrigger});
      malus += t.malus;
    }
  }

  const hard = triggersFired.some(t => t.hard);
  let sFinal = Math.max(0, Math.min(100, sAdj - malus));

  let classification: FinalResult["classification"];
  if (hard) classification = "Souffrance";
  else if (sFinal >= 75) classification = "Sain";
  else if (sFinal >= 65) classification = "Surveillance";
  else if (sFinal >= 50) classification = "Sensible probable";
  else classification = "Sensible";

  return {
    modelCode: model.modelCode,
    sEco, sAdj, malus, sFinal,
    classification,
    segmentCode, zoneCode,
    domainResults,
    triggersFired
  };
}
