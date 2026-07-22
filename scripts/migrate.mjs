import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL is not set"); process.exit(1); }
const sql = neon(url);
await sql`
  CREATE TABLE IF NOT EXISTS waitlist (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    zip TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;
console.log("waitlist table ready");
