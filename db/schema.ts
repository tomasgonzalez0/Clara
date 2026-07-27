import { integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  email: text("email").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const financeSettings = pgTable("finance_settings", {
  userEmail: text("user_email").primaryKey().references(() => users.email, { onDelete: "cascade" }),
  openingBalance: integer("opening_balance").notNull().default(204000),
  closedThroughMonth: text("closed_through_month").notNull().default("2026-07"),
  firstIncomeEstimate: integer("first_income_estimate").notNull().default(1200000),
  secondIncomeEstimate: integer("second_income_estimate").notNull().default(1500000),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const recurringExpenses = pgTable(
  "recurring_expenses",
  {
    id: serial("id").primaryKey(),
    userEmail: text("user_email").notNull().references(() => users.email, { onDelete: "cascade" }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    amount: integer("amount").notNull(),
    schedule: text("schedule").notNull(),
    dueDay: integer("due_day").notNull(),
    startMonth: text("start_month"),
    cycleStartAmount: integer("cycle_start_amount"),
  },
  (table) => [uniqueIndex("recurring_expenses_user_code_idx").on(table.userEmail, table.code)],
);

export const transactions = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    userEmail: text("user_email").notNull().references(() => users.email, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    type: text("type").notNull(),
    category: text("category").notNull(),
    occurredOn: text("occurred_on").notNull(),
    note: text("note"),
    recurringExpenseId: integer("recurring_expense_id").references(() => recurringExpenses.id, { onDelete: "set null" }),
    recurringPeriod: text("recurring_period"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("transactions_recurring_period_unique").on(
      table.userEmail,
      table.recurringExpenseId,
      table.recurringPeriod,
    ),
  ],
);

export const pocketAllocations = pgTable("pocket_allocations", {
  id: serial("id").primaryKey(),
  userEmail: text("user_email").notNull().references(() => users.email, { onDelete: "cascade" }),
  pocket: text("pocket").notNull(),
  amount: integer("amount").notNull(),
  occurredOn: text("occurred_on").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
