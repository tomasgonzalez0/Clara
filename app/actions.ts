"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/auth";
import { getDb } from "@/db";
import { financeSettings, pocketAllocations, recurringExpenses, transactions } from "@/db/schema";
import { balanceFromTransactions, bogotaToday, monthKey, plannedAmountForMonth, plannedExpensesForMonth } from "@/lib/finance/calculations";
import type { PocketAllocation, PocketName, RecurringExpense, Transaction } from "@/lib/finance/types";

const transactionSchema = z.object({
  amount: z.preprocess((value) => typeof value === "string" ? value.replace(/\D/g, "") : value, z.coerce.number().int().positive().max(100_000_000)),
  type: z.enum(["income", "expense"]),
  category: z.string().trim().min(2).max(40),
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().trim().max(160).optional(),
});

const pocketAllocationSchema = z.object({
  pocket: z.enum(["Obligaciones", "Mercado", "Movilidad", "Gato", "Gasto libre", "Colchon"]),
  amount: z.preprocess((value) => typeof value === "string" ? value.replace(/\D/g, "") : value, z.coerce.number().int().positive().max(100_000_000)),
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().trim().max(160).optional(),
});

async function currentUserEmail() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) throw new Error("Debes iniciar sesion para registrar movimientos.");
  return email;
}

function pocketForCategory(category: string): PocketName | null {
  if (["Hogar", "Servicios", "Educacion", "Finanzas"].includes(category)) return "Obligaciones";
  if (["Mercado", "Higiene"].includes(category)) return "Mercado";
  if (category === "Transporte") return "Movilidad";
  if (category === "Mascota") return "Gato";
  if (category === "Gasto libre") return "Gasto libre";
  return null;
}

const fixedPockets: PocketName[] = ["Obligaciones", "Mercado", "Movilidad", "Gato"];

function blankPocketTotals() {
  return { Obligaciones: 0, Mercado: 0, Movilidad: 0, Gato: 0, "Gasto libre": 0, Colchon: 0 } satisfies Record<PocketName, number>;
}

async function consumePocketBalance({
  email,
  pocket,
  amount,
  occurredOn,
  note,
}: {
  email: string;
  pocket: PocketName | null;
  amount: number;
  occurredOn: string;
  note: string;
}) {
  if (!pocket) return;
  const db = getDb();
  const allocations = await db
    .select({ amount: pocketAllocations.amount })
    .from(pocketAllocations)
    .where(and(eq(pocketAllocations.userEmail, email), eq(pocketAllocations.pocket, pocket)));
  const available = allocations.reduce((total, allocation) => total + allocation.amount, 0);
  const amountToConsume = Math.min(Math.max(0, available), amount);
  if (amountToConsume === 0) return;

  await db.insert(pocketAllocations).values({
    userEmail: email,
    pocket,
    amount: -amountToConsume,
    occurredOn,
    note,
  });
}

export async function addTransaction(formData: FormData) {
  const email = await currentUserEmail();
  const parsed = transactionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Revisa el monto, categoria y fecha del movimiento.");

  const db = getDb();
  const category = parsed.data.type === "income" ? "Ingreso" : parsed.data.category;
  await db.insert(transactions).values({
    userEmail: email,
    ...parsed.data,
    category,
    note: parsed.data.note || null,
  });
  if (parsed.data.type === "expense") {
    await consumePocketBalance({
      email,
      pocket: pocketForCategory(category),
      amount: parsed.data.amount,
      occurredOn: parsed.data.occurredOn,
      note: `Consumo: ${parsed.data.note || category}`,
    });
  }
  revalidatePath("/dashboard");
}

export async function addPocketAllocation(formData: FormData) {
  const email = await currentUserEmail();
  const parsed = pocketAllocationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Revisa el bolsillo, monto y fecha del aporte.");

  const db = getDb();
  await db.insert(pocketAllocations).values({
    userEmail: email,
    ...parsed.data,
    note: parsed.data.note || null,
  });
  revalidatePath("/dashboard");
}

export async function allocateFixedExpenses() {
  const email = await currentUserEmail();
  const db = getDb();
  const today = bogotaToday();
  const currentMonth = monthKey(today);
  const [settings] = await db
    .select()
    .from(financeSettings)
    .where(eq(financeSettings.userEmail, email));
  if (!settings) throw new Error("No se encontro la configuracion financiera.");

  const [expenseRows, movementRows, allocationRows] = await Promise.all([
    db.select().from(recurringExpenses).where(eq(recurringExpenses.userEmail, email)),
    db.select().from(transactions).where(eq(transactions.userEmail, email)),
    db.select().from(pocketAllocations).where(eq(pocketAllocations.userEmail, email)),
  ]);
  const expenses = expenseRows as RecurringExpense[];
  const movements = movementRows as Transaction[];
  const allocations = allocationRows as PocketAllocation[];
  const targets = plannedExpensesForMonth(expenses, currentMonth)
    .reduce<Record<PocketName, number>>((totals, expense) => {
      const pocket = pocketForCategory(expense.category);
      if (pocket) totals[pocket] += expense.plannedAmount;
      return totals;
    }, blankPocketTotals());
  const allocated = allocations.reduce<Record<PocketName, number>>((totals, allocation) => {
    totals[allocation.pocket] += allocation.amount;
    return totals;
  }, blankPocketTotals());
  const required = fixedPockets.reduce(
    (total, pocket) => total + Math.max(0, targets[pocket] - allocated[pocket]),
    0,
  );
  const balance = balanceFromTransactions(settings.openingBalance, movements);
  const alreadyAllocated = Object.values(allocated).reduce((total, amount) => total + amount, 0);
  const available = Math.max(0, balance - alreadyAllocated);

  if (required === 0) return;
  if (available < required) {
    throw new Error(`No hay saldo libre suficiente. Faltan ${required - available} COP para apartar los gastos fijos.`);
  }

  const occurredOn = `${currentMonth}-${String(today.getDate()).padStart(2, "0")}`;
  await db.insert(pocketAllocations).values(
    fixedPockets
      .map((pocket) => ({ pocket, amount: Math.max(0, targets[pocket] - allocated[pocket]) }))
      .filter((allocation) => allocation.amount > 0)
      .map((allocation) => ({
        userEmail: email,
        ...allocation,
        occurredOn,
        note: "Apartado automatico de gastos fijos",
      })),
  );
  revalidatePath("/dashboard");
}

export async function payRecurringExpense(formData: FormData) {
  const email = await currentUserEmail();
  const expenseId = z.coerce.number().int().positive().parse(formData.get("expenseId"));
  const db = getDb();
  const [expense] = await db
    .select()
    .from(recurringExpenses)
    .where(eq(recurringExpenses.id, expenseId));

  if (!expense || expense.userEmail !== email) throw new Error("No se encontro esa obligacion.");
  const paidOn = bogotaToday();
  const recurringPeriod = monthKey(paidOn);
  const amount = plannedAmountForMonth(expense as RecurringExpense, recurringPeriod);
  if (amount === 0) throw new Error("Esta obligacion no corresponde a este mes.");

  const [payment] = await db
    .insert(transactions)
    .values({
      userEmail: email,
      amount,
      type: "expense",
      category: expense.category,
      occurredOn: `${recurringPeriod}-${String(paidOn.getDate()).padStart(2, "0")}`,
      note: `${expense.name} - pago recurrente`,
      recurringExpenseId: expense.id,
      recurringPeriod,
    })
    .onConflictDoNothing({
      target: [transactions.userEmail, transactions.recurringExpenseId, transactions.recurringPeriod],
    })
    .returning({ id: transactions.id });
  if (payment) {
    await consumePocketBalance({
      email,
      pocket: pocketForCategory(expense.category),
      amount,
      occurredOn: `${recurringPeriod}-${String(paidOn.getDate()).padStart(2, "0")}`,
      note: `Consumo: ${expense.name}`,
    });
  }
  revalidatePath("/dashboard");
}
