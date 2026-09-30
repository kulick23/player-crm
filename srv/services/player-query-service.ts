import { Transaction } from '@sap/cds';
import type { PlayerStats } from '#cds-models/PlayerCRMService';

import {
  findFeedbacks,
  findInteractions,
  findLoyaltyEntries
} from '../repositories/activity-repository';
import { findPlayer } from '../repositories/player-repository';

export const getPlayerStats = async (
  tx: Transaction,
  playerID: string
): Promise<PlayerStats | null> => {
  const player = await findPlayer(tx, playerID);
  if (!player) return null;

  const [feedbacks, interactions, loyalty] = await Promise.all([
    findFeedbacks(tx, playerID),
    findInteractions(tx, playerID),
    findLoyaltyEntries(tx, playerID)
  ]);

  return {
    feedbackCount: feedbacks.length,
    interactionCount: interactions.length,
    loyaltyTotal: loyalty.reduce((sum, entry) => sum + Number(entry.price ?? 0), 0),
    averageRating: player.averageRating,
    activeSince: player.createdAt
  };
};
