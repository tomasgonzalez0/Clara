import type { RecurringExpense } from "@/lib/finance/types";

export const defaultRecurringExpenses: Omit<RecurringExpense, "id">[] = [
  { code: "admin", name: "Administracion", category: "Hogar", amount: 368_000, schedule: "monthly", dueDay: 5 },
  { code: "electricity", name: "Luz", category: "Servicios", amount: 180_000, schedule: "monthly", dueDay: 12 },
  { code: "claro", name: "Claro hogar", category: "Servicios", amount: 110_000, schedule: "monthly", dueDay: 10 },
  { code: "water", name: "Acueducto", category: "Servicios", amount: 90_000, schedule: "bimonthly", dueDay: 12, startMonth: "2026-08" },
  {
    code: "english",
    name: "Ingles",
    category: "Educacion",
    amount: 700_000,
    schedule: "english_cycle",
    dueDay: 5,
    startMonth: "2026-10",
    cycleStartAmount: 1_030_000,
  },
  { code: "market", name: "Mercado y despensa", category: "Mercado", amount: 800_000, schedule: "monthly", dueDay: 7 },
  { code: "cat_litter", name: "Arena para gato", category: "Mascota", amount: 70_000, schedule: "monthly", dueDay: 8 },
  { code: "cat_food", name: "Comida para gato", category: "Mascota", amount: 80_000, schedule: "monthly", dueDay: 8 },
  { code: "transport", name: "Transporte", category: "Transporte", amount: 300_000, schedule: "monthly", dueDay: 15 },
  { code: "bank_fee", name: "Cuota de manejo", category: "Finanzas", amount: 30_000, schedule: "monthly", dueDay: 5 },
  { code: "hygiene", name: "Aseo e higiene", category: "Higiene", amount: 100_000, schedule: "monthly", dueDay: 10 },
];

export const defaultPockets = [
  { name: "Obligaciones", color: "bg-violet-500" },
  { name: "Mercado y hogar", color: "bg-amber-400" },
  { name: "Movilidad", color: "bg-sky-500" },
  { name: "Gato", color: "bg-rose-400" },
  { name: "Gasto libre", color: "bg-emerald-500" },
  { name: "Colchon", color: "bg-slate-500" },
];
