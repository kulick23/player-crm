export const ORDER_ISSUE_STATUSES = {
  open: 'OPEN',
  inProgress: 'IN_PROGRESS',
  resolved: 'RESOLVED'
} as const;

export const ORDER_ISSUE_CATEGORIES = [
  'PRODUCT_NOT_RECEIVED',
  'PRODUCT_NOT_WORKING',
  'WRONG_PRODUCT',
  'PAYMENT_PROBLEM',
  'OTHER'
] as const;

export const isOrderIssueCategory = (value: unknown): boolean =>
  typeof value === 'string' &&
  ORDER_ISSUE_CATEGORIES.includes(value as (typeof ORDER_ISSUE_CATEGORIES)[number]);
