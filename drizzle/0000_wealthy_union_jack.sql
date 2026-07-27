CREATE TABLE "finance_settings" (
	"user_email" text PRIMARY KEY NOT NULL,
	"opening_balance" integer DEFAULT 204000 NOT NULL,
	"closed_through_month" text DEFAULT '2026-07' NOT NULL,
	"first_income_estimate" integer DEFAULT 1200000 NOT NULL,
	"second_income_estimate" integer DEFAULT 1500000 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurring_expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_email" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"amount" integer NOT NULL,
	"schedule" text NOT NULL,
	"due_day" integer NOT NULL,
	"start_month" text,
	"cycle_start_amount" integer
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_email" text NOT NULL,
	"amount" integer NOT NULL,
	"type" text NOT NULL,
	"category" text NOT NULL,
	"occurred_on" text NOT NULL,
	"note" text,
	"recurring_expense_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"email" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "finance_settings" ADD CONSTRAINT "finance_settings_user_email_users_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_user_email_users_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_email_users_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_recurring_expense_id_recurring_expenses_id_fk" FOREIGN KEY ("recurring_expense_id") REFERENCES "public"."recurring_expenses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "recurring_expenses_user_code_idx" ON "recurring_expenses" USING btree ("user_email","code");