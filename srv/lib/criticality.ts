export const ratingCriticality = (rating: unknown): number => {
  if (rating === null || rating === undefined) return 0;
  const value = Number(rating);
  if (value >= 4) return 3;
  if (value >= 3) return 2;
  return 1;
};

export const applyRatingCriticality = (rows: unknown, source: string): void => {
  const list = Array.isArray(rows) ? rows : [rows];
  for (const row of list) {
    if (row && typeof row === 'object' && source in row) {
      (row as Record<string, unknown>).ratingCriticality = ratingCriticality(
        (row as Record<string, unknown>)[source]
      );
    }
  }
};

export const applyActionVisibility = (rows: unknown, user: any): void => {
  const isAdmin = user.is('CRMAdmin');
  const isSupport = user.is('SupportAgent');
  const list = Array.isArray(rows) ? rows : [rows];
  for (const row of list) {
    if (row && typeof row === 'object') {
      (row as Record<string, unknown>).hideActivateVIP = !isAdmin;
      (row as Record<string, unknown>).hideGrantCompensation = !(isAdmin || isSupport);
    }
  }
};
