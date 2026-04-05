/**
 * Thin async wrapper to simulate network latency for loading states in demos.
 * All reads/writes still use local SQLite.
 */
const DEFAULT_DELAY_MS = 180;

export async function withSimulatedLatency<T>(
  fn: () => Promise<T>,
  delayMs: number = DEFAULT_DELAY_MS
): Promise<T> {
  await new Promise((r) => setTimeout(r, delayMs));
  return fn();
}
