import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";

export default function NewProjectPage() {
  async function createProject(formData: FormData) {
    "use server";
    const projectRef = String(formData.get("projectRef") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const city = String(formData.get("city") ?? "").trim();
    const zoneCode = String(formData.get("zoneCode") ?? "").trim();
    const segmentCode = String(formData.get("segmentCode") ?? "").trim();
    const promoterType = String(formData.get("promoterType") ?? "").trim();

    const p = await prisma.project.create({
      data: { projectRef, name, city, zoneCode, segmentCode, promoterType },
    });
    redirect(`/projects/${p.id}`);
  }

  return (
    <div>
      <h2>Nouveau projet</h2>
      <form action={createProject} style={{ display: "grid", gap: 10, maxWidth: 520 }}>
        <label>Référence projet <input name="projectRef" required /></label>
        <label>Nom <input name="name" required /></label>
        <label>Ville <input name="city" required /></label>
        <label>Zone <input name="zoneCode" placeholder="CASA_CORE / CASA_PERIPH / ..." required /></label>
        <label>Segment <input name="segmentCode" placeholder="INTERMEDIAIRE / TOURISTIQUE / ..." required /></label>
        <label>Typologie promoteur <input name="promoterType" placeholder="STRUCT_NAT / REGIONAL / OPPORTUNISTE" required /></label>
        <button type="submit">Créer</button>
      </form>
    </div>
  );
}
