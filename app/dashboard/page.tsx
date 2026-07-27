import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { addTransaction, payRecurringExpense } from "@/app/actions";
import { authOptions } from "@/auth";
import { DashboardContent } from "@/components/dashboard-content";
import { getDashboardData } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) redirect("/login");

  const data = await getDashboardData(email);
  return <DashboardContent data={data} email={email} addTransaction={addTransaction} payRecurringExpense={payRecurringExpense} />;
}
