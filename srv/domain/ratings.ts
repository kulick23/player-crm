interface RatedItem {
  rating?: number | null;
}

export const averageRating = (items: RatedItem[]): number | null => {
  if (!items.length) return null;
  const total = items.reduce((sum, item) => sum + Number(item.rating ?? 0), 0);
  return Math.round((total / items.length) * 10) / 10;
};

export const ratingCriticality = (rating: unknown): number => {
  if (rating === null || rating === undefined) return 0;
  const value = Number(rating);
  if (value >= 4) return 3;
  if (value >= 3) return 2;
  return 1;
};
