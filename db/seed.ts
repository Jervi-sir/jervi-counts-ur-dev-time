
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "./schema";
import "dotenv/config";

// ID specified by the user
const USER_ID = "bac789c5-fa0d-4fe3-b004-7027acc38f35";

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error("DATABASE_URL is not defined in .env");
}

const pool = new Pool({
  connectionString: dbUrl,
});

const db = drizzle(pool, { schema });

// Helper for random integer
const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Helper for random date in the past
const getDateDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
};

async function seed() {
  console.log("🌱 Sowing seeds...");

  try {
    // 1. Ensure the user profile exists
    // Note: In Supabase, auth.users is separate. 
    // We are only seeding the 'profiles' table which mirrors it.
    console.log(`Checking/Creating profile for ${USER_ID}...`);

    await db
      .insert(schema.profiles)
      .values({
        id: USER_ID,
        username: "jervi",
        fullName: "Jervi Dev",
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=jervi`,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.profiles.id,
        set: {
          username: "jervi_seeded",
          updatedAt: new Date(),
        },
      });

    // 2. Clear old data for this user to avoid duplicates if re-running
    console.log("Cleaning old data...");
    await db.delete(schema.dailyTotals).where(eq(schema.dailyTotals.userId, USER_ID));
    await db.delete(schema.dailyLanguageTotals).where(eq(schema.dailyLanguageTotals.userId, USER_ID));
    await db.delete(schema.activityEvents).where(eq(schema.activityEvents.userId, USER_ID));

    // 3. Generate 200 days of history
    console.log("Generating 200 days of coding history...");

    const totalsData: typeof schema.dailyTotals.$inferInsert[] = [];
    const languageData: typeof schema.dailyLanguageTotals.$inferInsert[] = [];

    const languages = ["TypeScript", "JavaScript", "Rust", "Go", "Python", "SQL"];

    for (let i = 0; i < 200; i++) {
      // days ago (0 to 199)
      const day = getDateDaysAgo(i);

      // Random focused seconds: 0 to 8 hours (28800 seconds)
      // Weighted towards non-zero days
      const isCodingDay = Math.random() > 0.1; // 90% chance of coding
      const focusedSeconds = isCodingDay ? randomInt(1800, 28800) : 0;

      totalsData.push({
        userId: USER_ID,
        day: day,
        focusedSeconds: focusedSeconds,
        source: "vscode",
      });

      // Distribute valid time across languages
      if (focusedSeconds > 0) {
        let remainingSeconds = focusedSeconds;
        // Pick 2-3 random languages for the day
        const dailyLangs = languages.sort(() => 0.5 - Math.random()).slice(0, randomInt(1, 3));

        dailyLangs.forEach((lang, idx) => {
          if (idx === dailyLangs.length - 1) {
            // Last language gets the remainder
            languageData.push({
              userId: USER_ID,
              day: day,
              language: lang,
              focusedSeconds: remainingSeconds,
            });
          } else {
            const split = randomInt(0, remainingSeconds);
            remainingSeconds -= split;
            languageData.push({
              userId: USER_ID,
              day: day,
              language: lang,
              focusedSeconds: split,
            });
          }
        });
      }
    }

    // Insert safely in chunks
    console.log(`Inserting ${totalsData.length} daily totals...`);
    // Drizzle insert many
    // Chunking might be needed for very large sets, but 200 is fine.
    if (totalsData.length > 0) await db.insert(schema.dailyTotals).values(totalsData);

    console.log(`Inserting ${languageData.length} language breakdowns...`);
    if (languageData.length > 0) await db.insert(schema.dailyLanguageTotals).values(languageData);

    console.log("✅ Seeding complete!");

  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await pool.end();
  }
}

seed();
