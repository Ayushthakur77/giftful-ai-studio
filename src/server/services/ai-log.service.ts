/**
 * In-memory ring buffer for AI request logs.
 *
 * Kept out of the DB in this drop to avoid a migration. Persistent
 * logging can be added later by writing to an `ai_request_logs` table.
 */
export type AiLogEntry = {
  ts: number;
  feature: string;
  model: string;
  userId?: string;
  ok: boolean;
  latencyMs: number;
  error?: string;
  snippet?: string;
};

const MAX = 200;
const ring: AiLogEntry[] = [];

export function aiLog(entry: Omit<AiLogEntry, "ts">) {
  ring.push({ ...entry, ts: Date.now() });
  if (ring.length > MAX) ring.splice(0, ring.length - MAX);
}

export function listAiLogs(limit = 100): AiLogEntry[] {
  return ring.slice(-limit).reverse();
}
