import type { CdsDate } from '#cds-models/_';

export const isoDate = (date: Date): CdsDate =>
  date.toISOString().slice(0, 10) as CdsDate;

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const laterDate = (left: Date, right?: string | null): Date => {
  if (!right) return left;
  const parsed = new Date(`${right}T00:00:00.000Z`);
  return parsed > left ? parsed : left;
};

export const daysBetween = (start: Date, end: Date): number => {
  const startDay = new Date(`${isoDate(start)}T00:00:00.000Z`);
  const endDay = new Date(`${isoDate(end)}T00:00:00.000Z`);
  return Math.max(0, Math.round((endDay.getTime() - startDay.getTime()) / 86_400_000));
};
