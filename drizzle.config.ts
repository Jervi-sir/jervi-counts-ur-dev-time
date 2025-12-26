// drizzle.config.ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Use Supabase connection string (prefer pooled one in production)
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
