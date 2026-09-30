import { Transaction } from '@sap/cds';

import { addDays, isoDate } from '../domain/dates';
import { Tier, VIP_TIERS } from '../domain/player';
import { createLoyaltyEntry } from '../repositories/activity-repository';
import { updatePlayer } from '../repositories/player-repository';
import { logInteraction } from './interaction-service';

export const activateVIP = async (
  tx: Transaction,
  playerID: string,
  tier: Tier
): Promise<void> => {
  const { price, days } = VIP_TIERS[tier];
  const startDate = new Date();
  const endDate = addDays(startDate, days);

  await createLoyaltyEntry(tx, {
    player_ID: playerID,
    tier,
    startDate: isoDate(startDate),
    endDate: isoDate(endDate),
    price,
    perks: 'Market discount, access to exclusive cases'
  });
  await updatePlayer(tx, playerID, { vipTier: tier });
  await logInteraction(
    tx,
    playerID,
    'VipActivated',
    `VIP subscription ${tier} activated until ${isoDate(endDate)}`
  );
};
