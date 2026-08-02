import type { PocketName } from "@/lib/finance/types";

export const pocketNames: PocketName[] = [
  "Obligaciones",
  "Mercado",
  "Movilidad",
  "Gato",
  "Gasto libre",
  "Colchon",
];

export function pocketForCategory(category: string): PocketName | null {
  if (pocketNames.includes(category as PocketName)) return category as PocketName;
  if (["Hogar", "Servicios", "Educacion", "Finanzas"].includes(category)) return "Obligaciones";
  if (["Mercado", "Higiene"].includes(category)) return "Mercado";
  if (category === "Transporte") return "Movilidad";
  if (category === "Mascota") return "Gato";
  return null;
}

export function emptyPocketTotals() {
  return { Obligaciones: 0, Mercado: 0, Movilidad: 0, Gato: 0, "Gasto libre": 0, Colchon: 0 } satisfies Record<PocketName, number>;
}
