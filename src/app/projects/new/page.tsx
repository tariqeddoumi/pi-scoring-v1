export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";

export default function NewProjectPage() {
  async function createProject(formData: FormData) {
    "use server";

    const name = formData.get("name")?.toString().trim() || "";
    const projectCode = formData.get("projectCode")?.toString().trim() || null;
    const city = formData.get("city")?.toString().trim() || null;
    const zone = formData.get("zone")?.toString().trim() || null;
    const segment = formData.get("segment")?.toString().trim() || null;
    const type = formData.get("type")?.toString().trim() || null;
    const currency = formData.get("currency")?.toString().trim() || "MAD";

    const totalCostRaw = formData.get("totalCost")?.toString().trim() || "";
    const financingAmountRaw = formData.get("financingAmount")?.toString().trim() || "";

    if (!name) {
      throw new Error("Le nom du projet est obligatoire.");
    }

    const project = await prisma.project.create({
      data: {
        name,
        projectCode,
        city,
        zone,
        segment,
        type,
        currency,
        totalCost: totalCostRaw ? totalCostRaw : undefined,
        financingAmount: financingAmountRaw ? financingAmountRaw : undefined,
      },
    });

    redirect(`/projects/${project.id}`);
  }

  return (
    <main className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Nouveau projet PI</h1>

      <form action={createProject} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Nom du projet</label>
          <input name="name" className="w-full border rounded px-3 py-2" required />
        </div>

        <div>
          <label className="block mb-1 font-medium">Code projet</label>
          <input name="projectCode" className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block mb-1 font-medium">Ville</label>
          <input name="city" className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block mb-1 font-medium">Zone</label>
          <input name="zone" className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block mb-1 font-medium">Segment</label>
          <input name="segment" className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block mb-1 font-medium">Type</label>
          <input name="type" className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block mb-1 font-medium">Devise</label>
          <input
            name="currency"
            defaultValue="MAD"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Coût total</label>
          <input
            name="totalCost"
            type="number"
            step="0.01"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Montant financement</label>
          <input
            name="financingAmount"
            type="number"
            step="0.01"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">
          Créer le projet
        </button>
      </form>
    </main>
  );
}
