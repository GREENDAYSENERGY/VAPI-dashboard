/** Rate: $0.50 per minute, billed in 15-second increments */
export const RATE_PER_MINUTE = 0.5;
export const BLOCK_SECONDS = 15;
/** Each 15-second block = $0.50 / 4 = $0.125 */
export const RATE_PER_BLOCK = RATE_PER_MINUTE / (60 / BLOCK_SECONDS); // 0.125

/**
 * Calculate client billing cost for a call.
 * Every partial 15-second block is rounded up.
 * e.g., 47s → ceil(47/15) = 4 blocks × $0.125 = $0.50
 */
export function calcCost(durationSeconds: number): number {
  if (!durationSeconds || durationSeconds <= 0) return 0;
  return Math.ceil(durationSeconds / BLOCK_SECONDS) * RATE_PER_BLOCK;
}

/** Number of 15-second blocks for a given duration */
export function calcBlocks(durationSeconds: number): number {
  if (!durationSeconds || durationSeconds <= 0) return 0;
  return Math.ceil(durationSeconds / BLOCK_SECONDS);
}

/** Format seconds to m:ss */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
