import cds, { Transaction } from '@sap/cds';
import type { Feedback, Interaction, LoyaltyProgram } from '#cds-models/playercrm';

import { ENTITIES } from './entities';

const { INSERT, SELECT } = cds.ql;

export const findFeedbacks = async (
  tx: Transaction,
  playerID: string
): Promise<Feedback[]> =>
  tx.run(SELECT.from(ENTITIES.feedback).where({ player_ID: playerID })) as Promise<Feedback[]>;

export const findInteractions = async (
  tx: Transaction,
  playerID: string
): Promise<Interaction[]> =>
  tx.run(SELECT.from(ENTITIES.interaction).where({ player_ID: playerID })) as Promise<
    Interaction[]
  >;

export const findLoyaltyEntries = async (
  tx: Transaction,
  playerID: string
): Promise<LoyaltyProgram[]> =>
  tx.run(SELECT.from(ENTITIES.loyaltyProgram).where({ player_ID: playerID })) as Promise<
    LoyaltyProgram[]
  >;

export const createInteraction = async (
  tx: Transaction,
  entry: Pick<Interaction, 'player_ID' | 'type' | 'date' | 'summary'>
): Promise<void> => {
  await tx.run(INSERT.into(ENTITIES.interaction).entries(entry));
};

export const createLoyaltyEntry = async (
  tx: Transaction,
  entry: Pick<LoyaltyProgram, 'player_ID' | 'tier' | 'startDate' | 'endDate' | 'price' | 'perks'>
): Promise<void> => {
  await tx.run(INSERT.into(ENTITIES.loyaltyProgram).entries(entry));
};
