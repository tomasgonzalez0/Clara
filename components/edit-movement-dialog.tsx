"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2, X } from "lucide-react";
import { formatCop } from "@/lib/finance/calculations";
import { pocketNames } from "@/lib/finance/pockets";
import type { PocketName, Transaction } from "@/lib/finance/types";

type Props = {
  movements: Transaction[];
  initialMovement: Transaction;
  updateTransaction: (formData: FormData) => void | Promise<void>;
  deleteTransaction: (formData: FormData) => void | Promise<void>;
  onClose: () => void;
};

function MoneyField({ initialValue }: { initialValue: number }) {
  const [value, setValue] = useState(String(initialValue));
  const displayValue = value ? new Intl.NumberFormat("es-CO").format(Number(value)) : "";
  return <div className="mt-2 flex overflow-hidden rounded-xl border border-stone-200 bg-white focus-within:border-emerald-500"><span className="grid w-10 place-items-center border-r border-stone-200 bg-stone-50 font-bold text-stone-500">$</span><input aria-label="Monto" inputMode="numeric" type="text" value={displayValue} onChange={(event) => setValue(event.target.value.replace(/\D/g, ""))} className="min-w-0 flex-1 px-3 py-3 text-sm font-bold outline-none" /><input type="hidden" name="amount" value={value} /></div>;
}

function SaveButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="w-full rounded-xl bg-emerald-600 py-3.5 font-bold text-white hover:bg-emerald-700 disabled:opacity-60">{pending ? "Guardando..." : "Guardar cambios"}</button>;
}

export function EditMovementDialog({ movements, initialMovement, updateTransaction, deleteTransaction, onClose }: Props) {
  const [movement, setMovement] = useState(initialMovement);
  const [type, setType] = useState<"income" | "expense">(initialMovement.type);
  const [category, setCategory] = useState(initialMovement.type === "income" ? "Ingreso" : (pocketNames.includes(initialMovement.category as PocketName) ? initialMovement.category : "Obligaciones"));
  const [confirmDelete, setConfirmDelete] = useState(false);

  function selectMovement(id: number) {
    const next = movements.find((item) => item.id === id);
    if (!next) return;
    setMovement(next);
    setType(next.type);
    setCategory(next.type === "income" ? "Ingreso" : (pocketNames.includes(next.category as PocketName) ? next.category : "Obligaciones"));
  }

  return <div className="fixed inset-0 z-40 grid place-items-center bg-stone-950/40 p-5"><section role="dialog" aria-modal="true" aria-labelledby="edit-movement-title" className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p id="edit-movement-title" className="text-sm font-bold text-stone-900">Editar movimiento</p><p className="text-sm text-stone-500">Corrige el registro sin crear otro movimiento.</p></div><button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-stone-100"><X size={18} /></button></div><label className="mt-5 block text-sm font-semibold">Movimiento reciente<select value={movement.id} onChange={(event) => selectMovement(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm font-normal outline-none focus:border-emerald-500">{movements.map((item) => <option key={item.id} value={item.id}>{item.occurredOn} · {item.note || item.category} · {formatCop(item.amount)}</option>)}</select></label><form key={movement.id} action={updateTransaction} className="mt-5 space-y-4"><input type="hidden" name="id" value={movement.id} /><div className="grid grid-cols-2 gap-3"><label><span className="text-sm font-semibold">Tipo</span><select name="type" value={type} onChange={(event) => { const nextType = event.target.value as "income" | "expense"; setType(nextType); setCategory(nextType === "income" ? "Ingreso" : "Obligaciones"); }} className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-500"><option value="expense">Gasto</option><option value="income">Ingreso</option></select></label><label><span className="text-sm font-semibold">Bolsillo</span><select name="category" value={category} disabled={type === "income"} onChange={(event) => setCategory(event.target.value)} className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-500 disabled:bg-stone-100">{type === "income" ? <option value="Ingreso">Ingreso</option> : pocketNames.map((pocket) => <option key={pocket} value={pocket}>{pocket}</option>)}</select></label></div><label className="block"><span className="text-sm font-semibold">Monto</span><MoneyField initialValue={movement.amount} /></label><div className="grid grid-cols-2 gap-3"><label><span className="text-sm font-semibold">Fecha</span><input name="occurredOn" type="date" defaultValue={movement.occurredOn} className="mt-2 w-full rounded-xl border border-stone-200 px-3 py-3 text-sm outline-none focus:border-emerald-500" /></label><label><span className="text-sm font-semibold">Nota</span><input name="note" defaultValue={movement.note || ""} maxLength={160} className="mt-2 w-full rounded-xl border border-stone-200 px-3 py-3 text-sm outline-none focus:border-emerald-500" /></label></div><SaveButton /></form><button type="button" onClick={() => setConfirmDelete(true)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-rose-700 hover:bg-rose-50"><Trash2 size={16} /> Eliminar movimiento</button>{confirmDelete && <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-4"><p className="font-bold text-rose-950">Eliminar {movement.type === "income" ? "ingreso" : "gasto"} de {formatCop(movement.amount)}?</p><p className="mt-1 text-sm text-rose-800">{movement.occurredOn} · {movement.note || movement.category}. Esta accion ajusta el saldo y no se puede deshacer.</p><div className="mt-4 grid grid-cols-2 gap-3"><button type="button" onClick={() => setConfirmDelete(false)} className="rounded-xl border border-rose-200 bg-white py-2.5 text-sm font-bold text-rose-800">Cancelar</button><form action={async (formData) => { await deleteTransaction(formData); onClose(); }}><input type="hidden" name="id" value={movement.id} /><button className="w-full rounded-xl bg-rose-600 py-2.5 text-sm font-bold text-white hover:bg-rose-700">Eliminar</button></form></div></div>}</section></div>;
}
