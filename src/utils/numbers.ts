export function toInt(v: unknown): number {
  const n = Number.parseInt(String(v), 10);
  return Number.isFinite(n) ? n : 0;
}

export function toNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
