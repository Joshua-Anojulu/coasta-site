import { neon } from "@neondatabase/serverless"

const databaseUrl = process.env.DATABASE_URL
if (databaseUrl === undefined || databaseUrl.length === 0) {
  console.error("DATABASE_URL is not set")
  process.exitCode = 1
} else {
  const sql = neon(databaseUrl)
  await sql`
    CREATE TABLE IF NOT EXISTS waitlist (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      zip TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  console.info("waitlist table ready")
}
