/**
 * Seed script — creates the admin user.
 * Run: npx tsx src/scripts/seed.ts
 * Requires DATABASE_URL and AUTH_EMAIL + AUTH_PASSWORD (plain text) in .env.local
 */
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/db/schema";

async function main() {
  const email = process.env.AUTH_EMAIL;
  const plainPassword = process.env.SEED_PASSWORD; // set in .env.local as SEED_PASSWORD

  if (!email || !plainPassword) {
    console.error("Set AUTH_EMAIL and SEED_PASSWORD in .env.local");
    process.exit(1);
  }

  const hashed = await hash(plainPassword, 12);
  console.log("\n✅ bcrypt hash (copy to AUTH_PASSWORD in .env.local and Vercel):");
  console.log(hashed);

  // Optionally insert into DB
  try {
    await db.insert(users).values({ email, password: hashed }).onConflictDoNothing();
    console.log("✅ User seeded:", email);
  } catch (e) {
    console.log("Note: DB insert skipped (may not have DATABASE_URL)", e);
  }
}

main().catch(console.error);
