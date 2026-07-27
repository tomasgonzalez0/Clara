import { describe, expect, it } from "vitest";
import { defaultRecurringExpenses } from "@/lib/finance/defaults";
import {
  averageMonthlyEssentialCost,
  bogotaToday,
  monthKey,
  monthlyTotal,
  plannedAmountForMonth,
  projectionMonths,
} from "@/lib/finance/calculations";
import type { RecurringExpense } from "@/lib/finance/types";

const expenses = defaultRecurringExpenses.map((expense, index) => ({ ...expense, id: index + 1 })) as RecurringExpense[];

describe("proyeccion financiera", () => {
  it("calcula los meses de acueducto y de inicio de ingles", () => {
    expect(monthlyTotal(expenses, "2026-08")).toBe(2_828_000);
    expect(monthlyTotal(expenses, "2026-09")).toBe(2_738_000);
    expect(monthlyTotal(expenses, "2026-10")).toBe(3_158_000);
  });

  it("cobra el inicio de ingles cada cuatro meses", () => {
    const english = expenses.find((expense) => expense.code === "english");
    if (!english) throw new Error("Falta el gasto de ingles");
    expect(plannedAmountForMonth(english, "2026-10")).toBe(1_030_000);
    expect(plannedAmountForMonth(english, "2026-11")).toBe(700_000);
    expect(plannedAmountForMonth(english, "2027-02")).toBe(1_030_000);
  });

  it("obtiene el promedio esencial esperado", () => {
    expect(averageMonthlyEssentialCost(expenses)).toBe(2_865_500);
  });

  it("usa la fecha de Colombia al cambiar de mes", () => {
    expect(monthKey(bogotaToday(new Date("2026-08-01T05:00:00Z")))).toBe("2026-08");
  });

  it("siempre proyecta el mes actual y los dos siguientes", () => {
    expect(projectionMonths("2026-07")).toEqual(["2026-07", "2026-08", "2026-09"]);
    expect(projectionMonths("2026-10")).toEqual(["2026-10", "2026-11", "2026-12"]);
  });
});
