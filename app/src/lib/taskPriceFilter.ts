/** Default max budget filter — must cover high-value tasks (e.g. interior design). */
export const TASK_PRICE_FILTER_MAX = 500_000;

export const TASK_PRICE_FILTER_DEFAULT: [number, number] = [0, TASK_PRICE_FILTER_MAX];

export function isWithinTaskPriceFilter(
  budget: number,
  range: [number, number] = TASK_PRICE_FILTER_DEFAULT,
): boolean {
  const b = Number.isFinite(budget) ? budget : 0;
  return b >= range[0] && b <= range[1];
}

export function isDefaultTaskPriceFilter(range: [number, number]): boolean {
  return range[0] === 0 && range[1] === TASK_PRICE_FILTER_MAX;
}
