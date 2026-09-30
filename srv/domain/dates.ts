import type { CdsDate } from '#cds-models/_';

export const isoDate = (date: Date): CdsDate =>
  date.toISOString().slice(0, 10) as CdsDate;

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
