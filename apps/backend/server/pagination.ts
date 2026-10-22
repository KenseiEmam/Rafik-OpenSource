/** Bounded optional page size; absent/invalid values preserve each API's default. */
export function pageSize(query: URLSearchParams, fallback: number): number {
  const value = Number(query.get("limit"));
  return Number.isInteger(value) && value >= 1 && value <= 100
    ? value
    : fallback;
}
