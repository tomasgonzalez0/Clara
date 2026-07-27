import type {
  PlannedExpense,
  RecurringExpense,
  Transaction,
} from "@/lib/finance/types";

export const COP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatCop(amount: number) {
  return COP.format(Math.round(amount));
}

export function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function bogotaToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  // Noon prevents the host timezone from moving this financial date into an adjacent month.
  return new Date(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    12,
  );
}

export function dateFromMonthKey(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

export function addMonths(key: string, amount: number) {
  const date = dateFromMonthKey(key);
  date.setMonth(date.getMonth() + amount);
  return monthKey(date);
}

export function projectionMonths(currentMonth: string, count = 3) {
  return Array.from({ length: count }, (_, index) =>
    addMonths(currentMonth, index),
  );
}

function monthsBetween(from: string, to: string) {
  const start = dateFromMonthKey(from);
  const end = dateFromMonthKey(to);
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    end.getMonth() -
    start.getMonth()
  );
}

export function plannedAmountForMonth(
  expense: RecurringExpense,
  targetMonth: string,
) {
  if (expense.schedule === "monthly") return expense.amount;

  if (!expense.startMonth) return expense.amount;

  const difference = monthsBetween(expense.startMonth, targetMonth);
  // The known cycle starts in October, but the current English course still costs its regular fee before then.
  if (difference < 0)
    return expense.schedule === "english_cycle" ? expense.amount : 0;

  if (expense.schedule === "bimonthly") {
    return difference % 2 === 0 ? expense.amount : 0;
  }

  return difference % 4 === 0
    ? (expense.cycleStartAmount ?? expense.amount)
    : expense.amount;
}

export function plannedExpensesForMonth(
  expenses: RecurringExpense[],
  targetMonth: string,
): PlannedExpense[] {
  return expenses
    .map((expense) => ({
      ...expense,
      plannedAmount: plannedAmountForMonth(expense, targetMonth),
      month: targetMonth,
    }))
    .filter((expense) => expense.plannedAmount > 0);
}

export function monthlyTotal(
  expenses: RecurringExpense[],
  targetMonth: string,
) {
  return plannedExpensesForMonth(expenses, targetMonth).reduce(
    (total, expense) => total + expense.plannedAmount,
    0,
  );
}

export function averageMonthlyEssentialCost(expenses: RecurringExpense[]) {
  const anchor = "2026-10";
  return (
    Array.from({ length: 12 }, (_, index) =>
      monthlyTotal(expenses, addMonths(anchor, index)),
    ).reduce((total, amount) => total + amount, 0) / 12
  );
}

export function balanceFromTransactions(
  openingBalance: number,
  transactions: Transaction[],
) {
  return transactions.reduce(
    (balance, transaction) =>
      transaction.type === "income"
        ? balance + transaction.amount
        : balance - transaction.amount,
    openingBalance,
  );
}

export function nextIncomeDate(today: Date) {
  const candidate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() <= 3 ? 3 : 18,
  );
  if (today.getDate() <= 3) return candidate;
  if (today.getDate() <= 18) return candidate;
  return new Date(today.getFullYear(), today.getMonth() + 1, 3);
}

export function requestToNextIncome({
  balance,
  expenses,
  today,
  safetyBuffer = 100_000,
}: {
  balance: number;
  expenses: RecurringExpense[];
  today: Date;
  safetyBuffer?: number;
}) {
  const nextIncome = nextIncomeDate(today);
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const nextIncomeEnd = new Date(
    nextIncome.getFullYear(),
    nextIncome.getMonth(),
    nextIncome.getDate(),
    23,
    59,
    59,
  );
  const bills = [monthKey(today), monthKey(nextIncome)].flatMap((targetMonth) =>
    plannedExpensesForMonth(expenses, targetMonth).filter((expense) => {
      const dueDate = new Date(
        dateFromMonthKey(targetMonth).getFullYear(),
        dateFromMonthKey(targetMonth).getMonth(),
        expense.dueDay,
      );
      return dueDate >= todayStart && dueDate <= nextIncomeEnd;
    }),
  );
  const committed = bills.reduce(
    (total, bill) => total + bill.plannedAmount,
    0,
  );

  return {
    nextIncome,
    committed,
    safetyBuffer,
    amount: Math.max(0, committed + safetyBuffer - balance),
  };
}
