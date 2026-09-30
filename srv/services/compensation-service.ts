import { Transaction } from '@sap/cds';
import type { MarketingCampaign } from '#cds-models/playercrm';

import { COMPENSATION_TYPES } from '../domain/compensation';
import { addDays, isoDate } from '../domain/dates';
import { createLoyaltyEntry } from '../repositories/activity-repository';
import { createPlayerCampaign } from '../repositories/campaign-repository';
import { updatePlayer } from '../repositories/player-repository';
import { logInteraction } from './interaction-service';

interface CompensationInput {
  campaign: MarketingCampaign;
  note?: string | null;
  playerBalance: number;
  playerID: string;
}

const bonusSummary = async (
  tx: Transaction,
  input: CompensationInput,
  value: number
): Promise<string> => {
  await updatePlayer(tx, input.playerID, { balance: input.playerBalance + value });
  return `${input.campaign.name}: ${value} added to the balance`;
};

const vipDaysSummary = async (
  tx: Transaction,
  input: CompensationInput,
  value: number
): Promise<string> => {
  const startDate = new Date();
  const endDate = addDays(startDate, value);
  const tier = `${value}days`;

  await createLoyaltyEntry(tx, {
    player_ID: input.playerID,
    tier,
    startDate: isoDate(startDate),
    endDate: isoDate(endDate),
    price: 0,
    perks: `Complimentary access granted by ${input.campaign.name}`
  });
  await updatePlayer(tx, input.playerID, { vipTier: tier });
  return `${input.campaign.name}: ${value} complimentary VIP days`;
};

const applyCompensation = async (
  tx: Transaction,
  input: CompensationInput
): Promise<string> => {
  const value = Number(input.campaign.compensationValue ?? 0);

  switch (input.campaign.compensationType) {
    case COMPENSATION_TYPES.bonus:
      return bonusSummary(tx, input, value);
    case COMPENSATION_TYPES.vipDays:
      return vipDaysSummary(tx, input, value);
    case COMPENSATION_TYPES.discount:
      return `${input.campaign.name}: ${value}% discount on the next purchase`;
    default:
      return `${input.campaign.name} granted`;
  }
};

export const grantCompensation = async (
  tx: Transaction,
  input: CompensationInput
): Promise<void> => {
  const summary = await applyCompensation(tx, input);

  await createPlayerCampaign(tx, {
    player_ID: input.playerID,
    campaign_ID: input.campaign.ID,
    note: input.note || null
  });
  await logInteraction(tx, input.playerID, 'CompensationGranted', summary);
};
