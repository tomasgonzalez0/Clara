"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/auth";
import { getDb } from "@/db";
import { recurringExpenses, transactions } from "@/db/schema";
import { bogotaToday, monthKey, plannedAmountForMonth } from "@/lib/finance/calculations";
import type { RecurringExpense } from "@/lib/finance/types";

const transactionSchema = z.object({
  amount: z.coerce.number().int().positive().max(100_000_000),
  type: z.enum(["income", "expense"]),
  category: z.string().trim().min(2).max(40),
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().trim().max(160).optional(),
});

async function currentUserEmail() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) throw new Error("Debes iniciar sesion para registrar movimientos.");
  return email;
}

export async function addTransaction(formData: FormData) {
  const email = await currentUserEmail();
  const parsed = transactionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Revisa el monto, categoria y fecha del movimiento.");

  const db = getDb();
  await db.insert(transactions).values({
    userEmail: email,
    ...parsed.data,
    category: parsed.data.type === "income" ? "Ingreso" : parsed.data.category,
    note: parsed.data.note || null,
  });
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

  await db
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
    });
  revalidatePath("/dashboard");
}
