"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, CalendarDays, Landmark, Plus, ReceiptText, ShieldCheck, Target, WalletCards, X } from "lucide-react";
import { formatCop } from "@/lib/finance/calculations";
import type { PlannedExpense, RecurringExpense, Transaction } from "@/lib/finance/types";

type DashboardData = {
  balance: number;
  projectedIncome: number;
  forecast: { month: string; total: number; items: PlannedExpense[] }[];
  currentPlan: PlannedExpense[];
  availableToSpend: number;
  request: { amount: number; committed: number; safetyBuffer: number; nextIncome: Date };
  amountToStabilize: number;
  amountForHealthyMonth: number;
  recentMovements: Transaction[];
  expenses: RecurringExpense[];
  settings: { firstIncomeEstimate: number; secondIncomeEstimate: number; closedThroughMonth: string };
};

type Props = {
  data: DashboardData;
  email: string;
  addTransaction: (formData: FormData) => void | Promise<void>;
  payRecurringExpense: (formData: FormData) => void | Promise<void>;
};

const categories = ["Mercado", "Transporte", "Mascota", "Hogar", "Servicios", "Higiene", "Educacion", "Gasto libre"];

function monthLabel(month: string) {
  return new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric" }).format(new Date(`${month}-02T12:00:00`));
}

function Pocket({ name, amount, color }: { name: string; amount: number; color: string }) {
  return <div className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm"><div className={`mb-4 h-2 w-9 rounded-full ${color}`} /><p className="text-xs font-bold text-stone-500">{name}</p><p className="mt-1 text-base font-bold text-stone-950">{formatCop(amount)}</p></div>;
}

export function DashboardContent({ data, email, addTransaction, payRecurringExpense }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("Mercado");
  const nextMonth = data.forecast[0];
  const sumCategories = (items: string[]) => nextMonth.items.filter((item) => items.includes(item.category)).reduce((total, item) => total + item.plannedAmount, 0);
  const guiltFreeAmount = Math.max(0, Math.min(200_000, data.projectedIncome - nextMonth.total - 100_000));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 pb-28 pt-5 sm:px-7 sm:pt-8">
      <header className="mb-7 flex items-center justify-between"><div><p className="mb-1 text-xs font-bold uppercase tracking-[.16em] text-emerald-700">Bancolombia · Personal</p><h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-950">Tu dinero, claro.</h1></div><div title={email} className="grid h-11 w-11 place-items-center rounded-full bg-stone-900 text-sm font-bold text-white">{email.charAt(0).toUpperCase()}</div></header>

      <section className="relative overflow-hidden rounded-[2rem] bg-stone-900 px-6 py-6 text-stone-50 shadow-xl shadow-stone-300/40 sm:px-8 sm:py-8"><div className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-emerald-400/20 blur-2xl" /><div className="relative"><p className="flex items-center gap-2 text-sm font-medium text-stone-300"><WalletCards size={17} /> Saldo en cuenta</p><p className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">{formatCop(data.balance)}</p><div className="mt-6 flex gap-3"><div className="rounded-xl bg-white/10 px-3 py-2"><p className="text-[11px] font-bold uppercase text-stone-300">Libre hoy</p><p className="mt-1 font-bold text-emerald-300">{formatCop(data.availableToSpend)}</p></div><div className="rounded-xl bg-white/10 px-3 py-2"><p className="text-[11px] font-bold uppercase text-stone-300">Proximo mes</p><p className="mt-1 font-bold">{formatCop(nextMonth.total)}</p></div></div></div></section>

      <section className="mt-5 grid gap-3 md:grid-cols-3"><article className="rounded-2xl border border-amber-200 bg-amber-50 p-5 md:col-span-2"><p className="flex items-center gap-2 text-sm font-bold text-amber-950"><Landmark size={17} /> Antes de pedir dinero</p><h2 className="mt-2 font-serif text-2xl font-semibold text-stone-950">{formatCop(data.amountToStabilize)} extra para estabilizar {monthLabel(nextMonth.month)}</h2><p className="mt-2 text-sm leading-6 text-amber-950/75">Gastos previstos: {formatCop(nextMonth.total)}. Ingreso estimado: {formatCop(data.projectedIncome)}. Este valor cubre la diferencia y un margen inicial de seguridad.</p><div className="mt-4 flex flex-wrap gap-2 text-xs font-bold"><span className="rounded-full bg-white px-3 py-1.5 text-stone-700">Hasta proximo ingreso: {formatCop(data.request.amount)}</span><span className="rounded-full bg-white px-3 py-1.5 text-stone-700">Meta saludable: {formatCop(3_600_000)}/mes</span><span className="rounded-full bg-white px-3 py-1.5 text-stone-700">Faltan: {formatCop(data.amountForHealthyMonth)}/mes</span></div></article><article className="rounded-2xl bg-emerald-700 p-5 text-white"><p className="flex items-center gap-2 text-sm font-bold text-emerald-100"><ShieldCheck size={17} /> Colchon</p><p className="mt-3 font-serif text-2xl font-semibold">{formatCop(300_000)}</p><p className="mt-1 text-sm leading-5 text-emerald-100">Meta antes de activar ahorro y viajes.</p></article></section>

      <section className="mt-8"><div className="mb-3 flex items-center justify-between"><div><p className="text-sm font-bold text-stone-900">Bolsillos para {monthLabel(nextMonth.month)}</p><p className="text-xs text-stone-500">Separa este dinero antes de usarlo.</p></div><Landmark size={19} className="text-stone-400" /></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"><Pocket name="Obligaciones" amount={sumCategories(["Hogar", "Servicios", "Educacion", "Finanzas"])} color="bg-violet-500" /><Pocket name="Mercado" amount={sumCategories(["Mercado", "Higiene"])} color="bg-amber-400" /><Pocket name="Movilidad" amount={sumCategories(["Transporte"])} color="bg-sky-500" /><Pocket name="Gato" amount={sumCategories(["Mascota"])} color="bg-rose-400" /><Pocket name="Gasto libre" amount={guiltFreeAmount} color="bg-emerald-500" /><Pocket name="Colchon" amount={100_000} color="bg-stone-500" /></div></section>

      <section className="mt-8 grid gap-5 lg:grid-cols-5"><article className="rounded-3xl border border-stone-200 bg-white p-5 lg:col-span-3"><p className="flex items-center gap-2 text-sm font-bold text-stone-900"><CalendarDays size={17} /> Proyeccion</p><p className="mt-1 text-sm text-stone-500">Los meses caros aparecen antes de que sean problema.</p><div className="mt-5 space-y-4">{data.forecast.slice(0, 3).map((month) => { const max = Math.max(...data.forecast.map((item) => item.total)); return <div key={month.month}><div className="mb-1.5 flex justify-between text-sm"><span className="capitalize text-stone-600">{monthLabel(month.month)}</span><b>{formatCop(month.total)}</b></div><div className="h-2 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full bg-stone-900" style={{ width: `${(month.total / max) * 100}%` }} /></div>{month.items.some((item) => item.code === "english" && item.plannedAmount > 700_000) && <p className="mt-1.5 text-xs font-bold text-rose-600">Inicio de ciclo de ingles incluido.</p>}</div>; })}</div></article><article className="rounded-3xl bg-stone-100 p-5 lg:col-span-2"><p className="flex items-center gap-2 text-sm font-bold text-stone-900"><Target size={17} /> Orden recomendado</p><ol className="mt-4 space-y-3 text-sm leading-5 text-stone-700"><li>1. Protege obligaciones y mercado.</li><li>2. Forma un colchon de {formatCop(300_000)}.</li><li>3. Activa Medellin y el segundo gato cuando el mes este cubierto.</li></ol></article></section>

      <section className="mt-8 grid gap-5 lg:grid-cols-2"><article className="rounded-3xl border border-stone-200 bg-white p-5"><p className="flex items-center gap-2 text-sm font-bold text-stone-900"><ReceiptText size={17} /> Pendiente este mes</p><p className="mt-1 text-sm text-stone-500">Marca una cuenta solo cuando este pagada.</p>{data.currentPlan.length === 0 ? <p className="mt-5 rounded-2xl bg-emerald-50 px-4 py-4 text-sm font-medium text-emerald-800">No hay obligaciones pendientes este mes.</p> : <div className="mt-4 divide-y divide-stone-100">{data.currentPlan.map((bill) => <div key={bill.id} className="flex items-center justify-between gap-3 py-3"><div><p className="font-semibold text-stone-900">{bill.name}</p><p className="text-xs text-stone-500">Dia {bill.dueDay} · {formatCop(bill.plannedAmount)}</p></div><form action={payRecurringExpense}><input type="hidden" name="expenseId" value={bill.id} /><button className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-900 hover:text-white">Pagar</button></form></div>)}</div>}</article><article className="rounded-3xl border border-stone-200 bg-white p-5"><p className="flex items-center gap-2 text-sm font-bold text-stone-900"><ReceiptText size={17} /> Ultimos movimientos</p><p className="mt-1 text-sm text-stone-500">Cada registro mantiene el saldo real.</p>{data.recentMovements.length === 0 ? <p className="mt-5 rounded-2xl bg-stone-50 px-4 py-4 text-sm text-stone-600">Aun no hay movimientos. Registra el siguiente gasto en menos de 10 segundos.</p> : <div className="mt-4 divide-y divide-stone-100">{data.recentMovements.map((movement) => <div key={movement.id} className="flex items-center justify-between py-3"><div className="flex items-center gap-3"><span className={`grid h-9 w-9 place-items-center rounded-full ${movement.type === "income" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{movement.type === "income" ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}</span><div><p className="font-semibold text-stone-900">{movement.note || movement.category}</p><p className="text-xs text-stone-500">{movement.occurredOn} · {movement.category}</p></div></div><b className={movement.type === "income" ? "text-emerald-700" : "text-stone-900"}>{movement.type === "income" ? "+" : "-"}{formatCop(movement.amount)}</b></div>)}</div>}</article></section>

      <button onClick={() => setFormOpen(true)} className="fixed bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-900/25 hover:bg-emerald-700"><Plus size={19} /> Registrar movimiento</button>
      {formOpen && <div className="fixed inset-0 z-30 flex items-end bg-stone-950/35 sm:items-center sm:justify-center sm:p-5"><div className="w-full max-w-lg rounded-t-[2rem] bg-white p-6 shadow-2xl sm:rounded-[2rem]"><div className="flex justify-between"><div><p className="text-sm font-bold text-stone-900">Registro rapido</p><p className="text-sm text-stone-500">Que salio o entro de la cuenta?</p></div><button onClick={() => setFormOpen(false)} className="grid h-9 w-9 place-items-center rounded-full bg-stone-100"><X size={18} /></button></div><form action={addTransaction} className="mt-6 space-y-5"><div className="grid grid-cols-2 rounded-xl bg-stone-100 p-1">{(["expense", "income"] as const).map((value) => <button key={value} type="button" onClick={() => setType(value)} className={`rounded-lg py-2 text-sm font-bold ${type === value ? "bg-white text-stone-950 shadow-sm" : "text-stone-500"}`}>{value === "expense" ? "Gasto" : "Ingreso"}</button>)}</div><input type="hidden" name="type" value={type} /><label className="block"><span className="text-sm font-semibold">Monto</span><input name="amount" required inputMode="numeric" type="number" min="1" placeholder="Ej. 45000" className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 text-xl font-bold outline-none focus:border-emerald-500" /></label><div><p className="text-sm font-semibold">Categoria</p><div className="mt-2 flex flex-wrap gap-2">{categories.map((option) => <button key={option} type="button" onClick={() => setCategory(option)} className={`rounded-full px-3 py-2 text-xs font-bold ${category === option ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600"}`}>{option}</button>)}</div><input type="hidden" name="category" value={category} /></div><div className="grid grid-cols-2 gap-3"><label><span className="text-sm font-semibold">Fecha</span><input name="occurredOn" type="date" defaultValue={today} className="mt-2 w-full rounded-xl border border-stone-200 px-3 py-3 text-sm outline-none focus:border-emerald-500" /></label><label><span className="text-sm font-semibold">Nota</span><input name="note" maxLength={160} placeholder="Opcional" className="mt-2 w-full rounded-xl border border-stone-200 px-3 py-3 text-sm outline-none focus:border-emerald-500" /></label></div><button type="submit" className="w-full rounded-xl bg-emerald-600 py-3.5 font-bold text-white hover:bg-emerald-700">Guardar movimiento</button></form></div></div>}
    </main>
  );
}
