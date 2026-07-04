import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import { env } from "../env";
import * as schema from "./schema";

let clientInstance: ReturnType<typeof postgres> | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function db() {
  if (dbInstance) return dbInstance;
  clientInstance = postgres(env().DATABASE_URL, {
    prepare: false, // required for pgBouncer / Supabase pooler; harmless elsewhere
    max: 1,
    idle_timeout: 20,
  });
  dbInstance = drizzle(clientInstance, { schema });
  return dbInstance;
}

export { schema };
