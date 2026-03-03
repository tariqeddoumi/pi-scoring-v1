import { prisma } from "@/lib/db/prisma";
import { ModelBundle } from "./model";

export async function loadActiveModel(): Promise<ModelBundle> {
  const mv = await prisma.modelVersion.findFirst({ where: { isActive: true }, orderBy: { createdAt: "desc" } });
  if (!mv) throw new Error("No active modelVersion");

  const domains = await prisma.domain.findMany({ where: { modelVersionId: mv.id } });
  const kpis = await prisma.kpi.findMany({ where: { modelVersionId: mv.id }, include: { thresholds: true, domain: true } });
  const segments = await prisma.segment.findMany({ where: { modelVersionId: mv.id } });
  const zones = await prisma.zone.findMany({ where: { modelVersionId: mv.id } });
  const triggers = await prisma.triggerRule.findMany({ where: { modelVersionId: mv.id } });

  return {
    modelCode: mv.code,
    domains: domains.map(d => ({ code: d.code as any, label: d.label, weight: Number(d.weight) })),
    kpis: kpis.map(k => ({
      code: k.code,
      label: k.label,
      domainCode: (k.domain.code as any),
      weight: Number(k.weight),
      direction: k.direction as any,
      thresholds: k.thresholds.map(t => ({
        status: t.status as any,
        minValue: t.minValue == null ? null : Number(t.minValue),
        maxValue: t.maxValue == null ? null : Number(t.maxValue),
        segmentCode: t.segmentCode,
        zoneCode: t.zoneCode,
      })),
    })),
    alphaSeg: Object.fromEntries(segments.map(s => [s.code, Number(s.alpha)])),
    betaZone: Object.fromEntries(zones.map(z => [z.code, Number(z.beta)])),
    triggers: triggers.map(t => ({ code: t.code, label: t.label, malus: Number(t.malus), isHardTrigger: t.isHardTrigger })),
  };
}
