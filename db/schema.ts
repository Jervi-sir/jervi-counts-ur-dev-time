// db/schema.ts
import {
  pgTable,
  uuid,
  text,
  date,
  integer,
  timestamp,
  primaryKey,
  index,
  uniqueIndex,
  check,
  jsonb,
  bigserial,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * profiles
 * - mirrors public user info for UI (username, avatar, etc.)
 * - id = auth.users.id (Supabase)
 */
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey(), // references auth.users(id) in Supabase
    username: text("username"),
    fullName: text("full_name"),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    usernameUnique: uniqueIndex("profiles_username_unique").on(t.username),
    usernameIdx: index("profiles_username_idx").on(t.username),
  })
);

/**
 * daily_totals
 * - the core tracking table (one row per user per day)
 * - store TOTAL seconds for the day (idempotent writes)
 */
export const dailyTotals = pgTable(
  "daily_totals",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),

    day: date("day").notNull(),

    focusedSeconds: integer("focused_seconds").notNull().default(0),

    // optional: track where it came from (future: web/mobile)
    source: text("source").notNull().default("vscode"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.day], name: "daily_totals_pk" }),
    dayIdx: index("daily_totals_day_idx").on(t.day),
    userDayIdx: index("daily_totals_user_day_idx").on(t.userId, t.day),

    focusedNonNeg: check(
      "daily_totals_focused_seconds_nonneg",
      sql`${t.focusedSeconds} >= 0`
    ),
  })
);

/**
 * OPTIONAL (recommended for later): daily_language_totals
 * - time split by language (php, typescript, go...)
 * - only store languageId buckets (no filenames/paths)
 */
export const dailyLanguageTotals = pgTable(
  "daily_language_totals",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),

    day: date("day").notNull(),

    language: text("language").notNull(), // e.g. 'php', 'typescript'

    focusedSeconds: integer("focused_seconds").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({
      columns: [t.userId, t.day, t.language],
      name: "daily_language_totals_pk",
    }),
    dayIdx: index("daily_language_totals_day_idx").on(t.day),
    userDayIdx: index("daily_language_totals_user_day_idx").on(t.userId, t.day),

    focusedNonNeg: check(
      "daily_language_totals_focused_seconds_nonneg",
      sql`${t.focusedSeconds} >= 0`
    ),
  })
);

/**
 * OPTIONAL (future): activity_events
 * - only when you want counts like copy/paste/keystrokes
 * - keep it aggregated + privacy-safe (no content, no file paths)
 */
export const activityEvents = pgTable(
  "activity_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),

    day: date("day").notNull(),

    kind: text("kind").notNull(), // 'keystrokes' | 'copy' | 'paste' | 'file_open' ...
    value: integer("value").notNull().default(0),

    meta: jsonb("meta").notNull().default({}),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userDayIdx: index("activity_events_user_day_idx").on(t.userId, t.day),
    dayIdx: index("activity_events_day_idx").on(t.day),
    kindIdx: index("activity_events_kind_idx").on(t.kind),
    valueNonNeg: check("activity_events_value_nonneg", sql`${t.value} >= 0`),
  })
);
