CREATE TABLE "activity_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"day" date NOT NULL,
	"kind" text NOT NULL,
	"value" integer DEFAULT 0 NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activity_events_value_nonneg" CHECK ("activity_events"."value" >= 0)
);
--> statement-breakpoint
CREATE TABLE "daily_language_totals" (
	"user_id" uuid NOT NULL,
	"day" date NOT NULL,
	"language" text NOT NULL,
	"focused_seconds" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_language_totals_pk" PRIMARY KEY("user_id","day","language"),
	CONSTRAINT "daily_language_totals_focused_seconds_nonneg" CHECK ("daily_language_totals"."focused_seconds" >= 0)
);
--> statement-breakpoint
CREATE TABLE "daily_totals" (
	"user_id" uuid NOT NULL,
	"day" date NOT NULL,
	"focused_seconds" integer DEFAULT 0 NOT NULL,
	"source" text DEFAULT 'vscode' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_totals_pk" PRIMARY KEY("user_id","day"),
	CONSTRAINT "daily_totals_focused_seconds_nonneg" CHECK ("daily_totals"."focused_seconds" >= 0)
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"username" text,
	"full_name" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_language_totals" ADD CONSTRAINT "daily_language_totals_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_totals" ADD CONSTRAINT "daily_totals_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_events_user_day_idx" ON "activity_events" USING btree ("user_id","day");--> statement-breakpoint
CREATE INDEX "activity_events_day_idx" ON "activity_events" USING btree ("day");--> statement-breakpoint
CREATE INDEX "activity_events_kind_idx" ON "activity_events" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "daily_language_totals_day_idx" ON "daily_language_totals" USING btree ("day");--> statement-breakpoint
CREATE INDEX "daily_language_totals_user_day_idx" ON "daily_language_totals" USING btree ("user_id","day");--> statement-breakpoint
CREATE INDEX "daily_totals_day_idx" ON "daily_totals" USING btree ("day");--> statement-breakpoint
CREATE INDEX "daily_totals_user_day_idx" ON "daily_totals" USING btree ("user_id","day");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_username_unique" ON "profiles" USING btree ("username");--> statement-breakpoint
CREATE INDEX "profiles_username_idx" ON "profiles" USING btree ("username");