export type KpiDirection = "higher_is_better" | "lower_is_better" | "boolean";

export type KpiStatus = "OK" | "VIG" | "CRIT";

export type Threshold = {
  status: KpiStatus;
  minValue?: number | null;
  maxValue?: number | null;
  segmentCode?: string | null;
  zoneCode?: string | null;
};

export type KpiDef = {
  code: string;
  label: string;
  domainCode: "D1" | "D2" | "D3" | "D4";
  weight: number;
  direction: KpiDirection;
  thresholds: Threshold[];
};

export type DomainDef = {
  code: "D1" | "D2" | "D3" | "D4";
  label: string;
  weight: number;
};

export type TriggerRule = {
  code: string;
  label: string;
  malus: number;
  isHardTrigger: boolean;
};

export type ModelBundle = {
  modelCode: string;
  domains: DomainDef[];
  kpis: KpiDef[];
  alphaSeg: Record<string, number>;
  betaZone: Record<string, number>;
  triggers: TriggerRule[];
};

export type EvaluationInput = Record<string, unknown>;

export type KpiResult = {
  code: string;
  label: string;
  value: unknown;
  status: KpiStatus;
  score0to5: number;
  weight: number;
  appliedThreshold?: { min?: number | null; max?: number | null; segment?: string | null; zone?: string | null } | null;
};

export type DomainResult = {
  code: DomainDef["code"];
  label: string;
  score0to1: number;
  score0to100: number;
  kpis: KpiResult[];
};

export type FinalResult = {
  modelCode: string;
  sEco: number;     // 0..100
  sAdj: number;     // 0..100 after alpha/beta
  malus: number;    // 0..100
  sFinal: number;   // 0..100
  classification: "Sain" | "Surveillance" | "Sensible probable" | "Sensible" | "Souffrance";
  segmentCode: string;
  zoneCode: string;
  domainResults: DomainResult[];
  triggersFired: { code: string; label: string; malus: number; hard: boolean }[];
};
