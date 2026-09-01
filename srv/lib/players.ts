import cds from '@sap/cds';

export type Tier = '7days' | '30days' | '90days';

interface TierDefinition {
  price: number;
  days: number;
}

export interface PlayerChanges {
  averageRating: number;
  status_ID?: string;
}

export const VIP_TIERS: Record<Tier, TierDefinition> = {
  '7days': { price: 149.0, days: 7 },
  '30days': { price: 279.0, days: 30 },
  '90days': { price: 599.0, days: 90 }
};

export const AT_RISK_THRESHOLD = 3;

export const isoDate = (date: Date): string => date.toISOString().slice(0, 10);

export const logInteraction = async (
  player_ID: string,
  type: string,
  summary: string
): Promise<void> => {
  const { Interaction } = cds.entities('playercrm');
  await INSERT.into(Interaction).entries({
    player_ID,
    type,
    date: new Date().toISOString(),
    summary
  });
};

export const syncPlayerRating = async (player_ID?: string): Promise<PlayerChanges | null> => {
  if (!player_ID) return null;

  const { Feedback, Player, PlayerStatus } = cds.entities('playercrm');
  const feedbacks = await SELECT.from(Feedback).where({ player_ID });
  if (!feedbacks.length) return null;

  const player = await SELECT.one.from(Player).where({ ID: player_ID });
  if (!player) return null;

  const total = feedbacks.reduce((sum: number, f: any) => sum + f.rating, 0);
  const averageRating = Math.round((total / feedbacks.length) * 10) / 10;
  const changes: PlayerChanges = { averageRating };

  const current = await SELECT.one.from(PlayerStatus).where({ ID: player.status_ID });
  const targetCode =
    averageRating < AT_RISK_THRESHOLD
      ? 'AtRisk'
      : current?.code === 'AtRisk'
        ? player.vipTier
          ? 'VIP'
          : 'Active'
        : null;

  if (targetCode && targetCode !== current?.code) {
    const target = await SELECT.one.from(PlayerStatus).where({ code: targetCode });
    if (target) changes.status_ID = target.ID;
  }

  await UPDATE(Player, player_ID).with(changes);

  if (changes.status_ID) {
    await logInteraction(
      player_ID,
      'StatusChanged',
      `Moved to ${targetCode} after the average rating changed to ${averageRating.toFixed(1)}`
    );
  }

  return changes;
};
