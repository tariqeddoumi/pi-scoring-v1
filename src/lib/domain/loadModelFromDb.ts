import { prisma } from "@/lib/db/prisma";

export async function loadModelFromDb(modelCode: string) {
  const [
    modelVersion,
    domainWeights,
    kpis,
    thresholds,
    segmentAdjustments,
    zoneAdjustments,
    d5Triggers,
  ] = await Promise.all([
    prisma.modelVersion.findUnique({
      where: { code: modelCode },
    }),
    prisma.domainWeight.findMany({
      where: { modelCode },
    }),
    prisma.kpi.findMany({
      where: {
        modelCode,
        isActive: true,
      },
      orderBy: {
        kpiCode: "asc",
      },
    }),
    prisma.kpiThreshold.findMany({
      where: { modelCode },
    }),
    prisma.segmentAdjustment.findMany({
      where: { modelCode },
    }),
    prisma.zoneAdjustment.findMany({
      where: { modelCode },
    }),
    prisma.d5Trigger.findMany({
      where: { modelCode },
    }),
  ]);

  return {
    modelVersion,
    domainWeights,
    kpis,
    thresholds,
    segmentAdjustments,
    zoneAdjustments,
    d5Triggers,
  };
}
