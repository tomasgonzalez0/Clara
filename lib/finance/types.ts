export type ExpenseSchedule = "monthly" | "bimonthly" | "english_cycle";

export type ExpenseCategory =
  | "Hogar"
  | "Servicios"
  | "Educacion"
  | "Mercado"
  | "Mascota"
  | "Transporte"
  | "Finanzas"
  | "Higiene";

export type RecurringExpense = {
  id: number;
  code: string;
  name: string;
  category: ExpenseCategory;
  amount: number;
  schedule: ExpenseSchedule;
  dueDay: number;
  startMonth?: string;
  cycleStartAmount?: number;
};

export type Transaction = {
  id: number;
  amount: number;
  type: "income" | "expense";
  category: string;
  occurredOn: string;
  note: string | null;
  recurringExpenseId: number | null;
  recurringPeriod: string | null;
};

export type PlannedExpense = RecurringExpense & {
  plannedAmount: number;
  month: string;
};

export type PocketName = "Obligaciones" | "Mercado" | "Movilidad" | "Gato" | "Gasto libre" | "Colchon";

export type PocketAllocation = {
  id: number;
  pocket: PocketName;
  amount: number;
  occurredOn: string;
  note: string | null;
};
