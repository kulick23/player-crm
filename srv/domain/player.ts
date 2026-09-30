export const ROLES = {
  admin: 'CRMAdmin',
  support: 'SupportAgent',
  community: 'CommunityManager'
} as const;

export const PLAYER_STATUSES = {
  active: 'Active',
  atRisk: 'AtRisk',
  vip: 'VIP'
} as const;

export const AT_RISK_THRESHOLD = 3;

export type Tier = keyof typeof VIP_TIERS;

export interface TierDefinition {
  price: number;
  days: number;
}

export const VIP_TIERS = {
  '7days': { price: 149, days: 7 },
  '30days': { price: 279, days: 30 },
  '90days': { price: 599, days: 90 }
} as const satisfies Record<string, TierDefinition>;

export const isTier = (value: unknown): value is Tier =>
  typeof value === 'string' && value in VIP_TIERS;

export const nextStatusForRating = (
  averageRating: number,
  currentStatus?: string | null,
  vipTier?: string | null
): string | null => {
  if (averageRating < AT_RISK_THRESHOLD) return PLAYER_STATUSES.atRisk;
  if (currentStatus !== PLAYER_STATUSES.atRisk) return null;
  return vipTier ? PLAYER_STATUSES.vip : PLAYER_STATUSES.active;
};
