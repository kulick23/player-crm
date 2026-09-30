import { Transaction } from '@sap/cds';

import { createInteraction } from '../repositories/activity-repository';

export const logInteraction = async (
  tx: Transaction,
  playerID: string,
  type: string,
  summary: string
): Promise<void> =>
  createInteraction(tx, {
    player_ID: playerID,
    type,
    date: new Date().toISOString(),
    summary
  });
