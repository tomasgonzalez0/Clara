CREATE TABLE "pocket_allocations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_email" text NOT NULL,
	"pocket" text NOT NULL,
	"amount" integer NOT NULL,
	"occurred_on" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pocket_allocations" ADD CONSTRAINT "pocket_allocations_user_email_users_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;