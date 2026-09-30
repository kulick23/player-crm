import { ROLES } from './player';
import { ratingCriticality } from './ratings';

interface RoleAwareUser {
  is(role: string): boolean;
}

const rowsOf = (value: unknown): Record<string, unknown>[] => {
  const values = Array.isArray(value) ? value : [value];
  return values.filter(
    (row): row is Record<string, unknown> => row !== null && typeof row === 'object'
  );
};

export const applyRatingCriticality = (rows: unknown, source: string): void => {
  for (const row of rowsOf(rows)) {
    if (source in row) row.ratingCriticality = ratingCriticality(row[source]);
  }
};

export const applyActionVisibility = (rows: unknown, user: RoleAwareUser): void => {
  const isAdmin = user.is(ROLES.admin);
  const canGrantCompensation = isAdmin || user.is(ROLES.support);

  for (const row of rowsOf(rows)) {
    row.hideActivateVIP = !isAdmin;
    row.hideGrantCompensation = !canGrantCompensation;
  }
};
