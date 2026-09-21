/**
 * Zero-safe URL parameter parsing (VULN-13).
 *
 * `Number(x) || default` collapses legitimate `0` values to the default,
 * which silently diverges shared configs from rendered economics
 * (e.g. `?salvage=0` or `?idleHours=0` rendering 20% / 9h instead).
 * This helper honors 0 and only falls back when the value is absent or NaN.
 */
export function numParam(
  raw: string | null,
  fallback: number,
  min: number,
  max: number
): number {
  if (raw === null || raw.trim() === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
