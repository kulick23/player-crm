import cds, { Transaction } from '@sap/cds';
import type { Feedback, Interaction, LoyaltyProgram } from '#cds-models/playercrm';

import { ENTITIES } from './entities';

const { INSERT, SELECT, UPDATE } = cds.ql;

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

export const createFeedback = async (
  tx: Transaction,
  entry: Pick<Feedback, 'player_ID' | 'rating' | 'comment' | 'feedbackDate'>
): Promise<void> => {
  await tx.run(INSERT.into(ENTITIES.feedback).entries(entry));
};

export const createLoyaltyEntry = async (
  tx: Transaction,
  entry: Pick<LoyaltyProgram, 'player_ID' | 'tier' | 'startDate' | 'endDate' | 'price' | 'perks'>
): Promise<void> => {
  await tx.run(INSERT.into(ENTITIES.loyaltyProgram).entries(entry));
};

export const findLatestActiveLoyaltyEndDate = async (
  tx: Transaction,
  playerID: string,
  today: string
): Promise<string | null> => {
  const entry = (await tx.run(
    SELECT.one
      .from(ENTITIES.loyaltyProgram)
      .columns('endDate')
      .where`player_ID = ${playerID} and endDate >= ${today}`
      .orderBy('endDate desc')
  )) as Pick<LoyaltyProgram, 'endDate'> | undefined;
  return entry?.endDate ?? null;
};

export const expireActiveLoyaltyEntries = async (
  tx: Transaction,
  playerID: string,
  today: string
): Promise<void> => {
  await tx.run(
    UPDATE.entity(ENTITIES.loyaltyProgram)
      .set({ endDate: today })
      .where`player_ID = ${playerID} and endDate > ${today}`
  );
};
