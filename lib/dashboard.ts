import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  financeSettings,
  pocketAllocations,
  recurringExpenses,
  transactions,
  users,
} from "@/db/schema";
import { defaultRecurringExpenses } from "@/lib/finance/defaults";
import { emptyPocketTotals, pocketForCategory } from "@/lib/finance/pockets";
import {
  averageMonthlyEssentialCost,
  balanceFromTransactions,
  bogotaToday,
  monthKey,
  monthlyTotal,
  plannedExpensesForMonth,
  projectionMonths,
  requestToNextIncome,
} from "@/lib/finance/calculations";
import type { PocketAllocation, PocketName, RecurringExpense, Transaction } from "@/lib/finance/types";

export async function ensureUserData(email: string) {
  const db = getDb();
  await db.insert(users).values({ email }).onConflictDoNothing();
  await db
    .insert(financeSettings)
    .values({ userEmail: email })
    .onConflictDoNothing({ target: financeSettings.userEmail });

  const existing = await db
    .select({ id: recurringExpenses.id })
    .from(recurringExpenses)
    .where(eq(recurringExpenses.userEmail, email))
    .limit(1);

  if (existing.length === 0) {
    await db
      .insert(recurringExpenses)
      .values(
        defaultRecurringExpenses.map((expense) => ({
          ...expense,
          userEmail: email,
        })),
      )
      .onConflictDoNothing();
  }
}

export async function getDashboardData(email: string, requestedMonth?: string) {
  await ensureUserData(email);
  const db = getDb();
  const [settings] = await db
    .select()
    .from(financeSettings)
    .where(eq(financeSettings.userEmail, email));
  if (!settings)
    throw new Error("No fue posible crear la configuracion financiera.");
  const expenseRows = await db
    .select()
    .from(recurringExpenses)
    .where(eq(recurringExpenses.userEmail, email));
  const transactionRows = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userEmail, email))
    .orderBy(desc(transactions.occurredOn));
  const allocationRows = await db
    .select()
    .from(pocketAllocations)
    .where(eq(pocketAllocations.userEmail, email));

  const expenses = expenseRows as RecurringExpense[];
  const movements = transactionRows as Transaction[];
  const allocations = allocationRows as PocketAllocation[];
  const today = bogotaToday();
  const actualMonth = monthKey(today);
  const currentMonth = requestedMonth && /^\d{4}-(0[1-9]|1[0-2])$/.test(requestedMonth)
    ? requestedMonth
    : actualMonth;
  const forecast = projectionMonths(currentMonth, 4).map((month) => {
    return {
      month,
      total: monthlyTotal(expenses, month),
      items: plannedExpensesForMonth(expenses, month),
    };
  });
  const balance = balanceFromTransactions(settings.openingBalance, movements);
  const averageEssential = averageMonthlyEssentialCost(expenses);
  const projectedIncome =
    settings.firstIncomeEstimate + settings.secondIncomeEstimate;
  const nextMonthTotal = forecast[0].total;
  const request = requestToNextIncome({ balance, expenses, today });
  // Existing cash can cover part of the next month; do not ask for it a second time.
  const amountToStabilize = Math.max(
    0,
    nextMonthTotal + 100_000 - projectedIncome - balance,
  );
  const amountForHealthyMonth = Math.max(0, 3_600_000 - projectedIncome);
  const paidCurrentRecurringIds = new Set(
    movements
      .filter(
        (movement) =>
          movement.recurringExpenseId &&
          (movement.recurringPeriod === currentMonth ||
            (!movement.recurringPeriod && movement.occurredOn.startsWith(currentMonth))),
      )
      .map((movement) => movement.recurringExpenseId),
  );
  const currentPlan =
    currentMonth !== actualMonth || currentMonth <= settings.closedThroughMonth
      ? []
      : plannedExpensesForMonth(expenses, currentMonth).filter(
          (expense) => !paidCurrentRecurringIds.has(expense.id),
        );
  const unpaidCurrentPlan = currentPlan.reduce(
    (total, item) => total + item.plannedAmount,
    0,
  );
  const allocatedByPocket = allocations.reduce<Record<PocketName, number>>(
    (totals, allocation) => {
      // Negative rows without a transaction link came from an old double-counting bug.
      if (allocation.amount < 0 && !allocation.transactionId) return totals;
      totals[allocation.pocket] += allocation.amount;
      return totals;
    },
    emptyPocketTotals(),
  );
  const paidByPocket = movements
    .filter((movement) => movement.type === "expense" && movement.occurredOn.startsWith(currentMonth))
    .reduce<Record<PocketName, number>>((totals, movement) => {
      const pocket = pocketForCategory(movement.category);
      if (pocket) totals[pocket] += movement.amount;
      return totals;
    }, emptyPocketTotals());
  const pocketTargets = plannedExpensesForMonth(expenses, currentMonth).reduce<Record<PocketName, number>>(
    (totals, expense) => {
      const pocket = pocketForCategory(expense.category);
      if (pocket) totals[pocket] += expense.plannedAmount;
      return totals;
    },
    emptyPocketTotals(),
  );
  pocketTargets["Gasto libre"] = settings.freeSpendingTarget;
  pocketTargets.Colchon = settings.cushionTarget;
  const outstandingByPocket = emptyPocketTotals();
  const overspentByPocket = emptyPocketTotals();
  (Object.keys(pocketTargets) as PocketName[]).forEach((pocket) => {
    outstandingByPocket[pocket] = Math.max(0, pocketTargets[pocket] - paidByPocket[pocket]);
    overspentByPocket[pocket] = Math.max(0, paidByPocket[pocket] - pocketTargets[pocket]);
  });
  const allocatedTotal = Object.values(allocatedByPocket).reduce(
    (total, amount) => total + Math.max(0, amount),
    0,
  );

  return {
    settings,
    expenses,
    movements,
    balance,
    averageEssential,
    projectedIncome,
    forecast,
    currentMonth,
    isCurrentMonth: currentMonth === actualMonth,
    currentPlan,
    allocatedByPocket,
    pocketTargets,
    paidByPocket,
    outstandingByPocket,
    overspentByPocket,
    request,
    amountToStabilize,
    amountForHealthyMonth,
    availableToSpend: Math.max(0, balance - unpaidCurrentPlan),
    unallocatedBalance: Math.max(0, balance - allocatedTotal),
    recentMovements: movements.slice(0, 20),
  };
}
