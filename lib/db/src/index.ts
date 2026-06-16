import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

let pool: pg.Pool;
let db: ReturnType<typeof drizzle>;

if (databaseUrl) {
  pool = new Pool({ connectionString: databaseUrl });
  db = drizzle(pool, { schema });
} else {
  console.warn("DATABASE_URL not set. Database features will not work.");
  // Create a dummy pool and db that won't connect
  pool = new Pool({ connectionString: "postgresql://localhost/dummy" });
  db = drizzle(pool, { schema });
}

export { pool, db };
export * from "./schema";
