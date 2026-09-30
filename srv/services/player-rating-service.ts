import { Transaction } from '@sap/cds';
import type { Player } from '#cds-models/playercrm';

import { nextStatusForRating } from '../domain/player';
import { averageRating } from '../domain/ratings';
import { findFeedbacks } from '../repositories/activity-repository';
import {
  findPlayer,
  findStatusByCode,
  findStatusByID,
  updatePlayer
} from '../repositories/player-repository';
import { logInteraction } from './interaction-service';

export type PlayerChanges = Pick<Player, 'averageRating' | 'status_ID'>;

export const syncPlayerRating = async (
  tx: Transaction,
  playerID?: string | null
): Promise<PlayerChanges | null> => {
  if (!playerID) return null;

  const feedbacks = await findFeedbacks(tx, playerID);
  const calculatedRating = averageRating(feedbacks);
  if (calculatedRating === null) return null;

  const player = await findPlayer(tx, playerID);
  if (!player) return null;

  const changes: PlayerChanges = { averageRating: calculatedRating };
  const currentStatus = await findStatusByID(tx, player.status_ID);
  const targetCode = nextStatusForRating(
    calculatedRating,
    currentStatus?.code,
    player.vipTier
  );

  if (targetCode && targetCode !== currentStatus?.code) {
    const targetStatus = await findStatusByCode(tx, targetCode);
    if (targetStatus?.ID) changes.status_ID = targetStatus.ID;
  }

  await updatePlayer(tx, playerID, changes);

  if (changes.status_ID && targetCode) {
    await logInteraction(
      tx,
      playerID,
      'StatusChanged',
      `Moved to ${targetCode} after the average rating changed to ${calculatedRating.toFixed(1)}`
    );
  }

  return changes;
};
