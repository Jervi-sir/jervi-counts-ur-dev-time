// db/relations.ts
import { relations } from "drizzle-orm";
import { profiles, dailyTotals, dailyLanguageTotals, activityEvents } from "./schema";

export const profilesRelations = relations(profiles, ({ many }) => ({
  dailyTotals: many(dailyTotals),
  dailyLanguageTotals: many(dailyLanguageTotals),
  activityEvents: many(activityEvents),
}));

export const dailyTotalsRelations = relations(dailyTotals, ({ one }) => ({
  profile: one(profiles, {
    fields: [dailyTotals.userId],
    references: [profiles.id],
  }),
}));

export const dailyLanguageTotalsRelations = relations(dailyLanguageTotals, ({ one }) => ({
  profile: one(profiles, {
    fields: [dailyLanguageTotals.userId],
    references: [profiles.id],
  }),
}));

export const activityEventsRelations = relations(activityEvents, ({ one }) => ({
  profile: one(profiles, {
    fields: [activityEvents.userId],
    references: [profiles.id],
  }),
}));
