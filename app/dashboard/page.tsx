import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { addPocketAllocation, addTransaction, allocateFixedExpenses, deleteTransaction, payRecurringExpense, resetBudgetSettings, updateBudgetSettings, updateTransaction } from "@/app/actions";
import { authOptions } from "@/auth";
import { DashboardContent } from "@/components/dashboard-content";
import { getDashboardData } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) redirect("/login");

  const { month } = await searchParams;
  const data = await getDashboardData(email, month);
  return <DashboardContent data={data} email={email} addTransaction={addTransaction} addPocketAllocation={addPocketAllocation} allocateFixedExpenses={allocateFixedExpenses} payRecurringExpense={payRecurringExpense} updateTransaction={updateTransaction} deleteTransaction={deleteTransaction} updateBudgetSettings={updateBudgetSettings} resetBudgetSettings={resetBudgetSettings} />;
}
