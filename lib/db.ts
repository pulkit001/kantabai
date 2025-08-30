import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import type { NeonQueryFunction } from "@neondatabase/serverless";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Configure neon client
const sql = neon(process.env.DATABASE_URL, {
  arrayMode: false,
  fullResults: false
});

export const db = drizzle(sql as NeonQueryFunction<boolean, boolean>, { schema });

// Export the schema for easy access
export { schema };
