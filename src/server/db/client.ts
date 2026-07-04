import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { env } from "../env";
import * as schema from "./schema";

// Cache HTTP connections across invocations
neonConfig.fetchConnectionCache = true;

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function db() {
  if (dbInstance) return dbInstance;
  const sql = neon(env().DATABASE_URL);
  dbInstance = drizzle(sql, { schema });
  return dbInstance;
}

export { schema };
