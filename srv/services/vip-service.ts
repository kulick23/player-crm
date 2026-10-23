import { Transaction } from '@sap/cds';

import { addDays, daysBetween, isoDate, laterDate } from '../domain/dates';
import { PLAYER_STATUSES, Tier, VIP_TIERS } from '../domain/player';
import {
  createLoyaltyEntry,
  expireActiveLoyaltyEntries,
  findLatestActiveLoyaltyEndDate
} from '../repositories/activity-repository';
import { findPlayer, findStatusByCode, updatePlayer } from '../repositories/player-repository';
import { logInteraction } from './interaction-service';

interface VIPExtension {
  days: number;
  perks: string;
  price: number;
  tier: string;
}

export const extendVIP = async (
  tx: Transaction,
  playerID: string,
  extension: VIPExtension
): Promise<{ endDate: string; totalDays: number }> => {
  const today = new Date();
  const todayISO = isoDate(today);
  const currentEndDate = await findLatestActiveLoyaltyEndDate(tx, playerID, todayISO);
  const extensionStart = laterDate(today, currentEndDate);
  const endDate = addDays(extensionStart, extension.days);
  const totalDays = daysBetween(today, endDate);
  const vipStatus = await findStatusByCode(tx, PLAYER_STATUSES.vip);

  await createLoyaltyEntry(tx, {
    player_ID: playerID,
    tier: extension.tier,
    startDate: isoDate(extensionStart),
    endDate: isoDate(endDate),
    price: extension.price,
    perks: extension.perks
  });
  await updatePlayer(tx, playerID, {
    vipTier: `${totalDays}days`,
    ...(vipStatus?.ID ? { status_ID: vipStatus.ID } : {})
  });

  return { endDate: isoDate(endDate), totalDays };
};

export const activateVIP = async (
  tx: Transaction,
  playerID: string,
  tier: Tier
): Promise<void> => {
  const { price, days } = VIP_TIERS[tier];
  const { endDate } = await extendVIP(tx, playerID, {
    days,
    tier,
    price,
    perks: 'Market discount, access to exclusive cases'
  });
  await logInteraction(
    tx,
    playerID,
    'VipActivated',
    `VIP subscription ${tier} extended by ${days} days until ${endDate}`
  );
};

export const cancelVIP = async (tx: Transaction, playerID: string): Promise<void> => {
  const player = await findPlayer(tx, playerID);
  if (!player) return;

  const targetCode = Number(player.averageRating ?? 0) < 3
    ? PLAYER_STATUSES.atRisk
    : PLAYER_STATUSES.active;
  const targetStatus = await findStatusByCode(tx, targetCode);
  const today = isoDate(new Date());

  await expireActiveLoyaltyEntries(tx, playerID, today);
  await updatePlayer(tx, playerID, {
    vipTier: null,
    ...(targetStatus?.ID ? { status_ID: targetStatus.ID } : {})
  });
  await logInteraction(tx, playerID, 'VipCancelled', `VIP subscription cancelled on ${today}`);
};
