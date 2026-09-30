import cds, { Transaction } from '@sap/cds';
import type { MarketingCampaign, PlayerCampaign } from '#cds-models/playercrm';

import { ENTITIES } from './entities';

const { INSERT, SELECT } = cds.ql;

export const findCampaign = async (
  tx: Transaction,
  campaignID: string
): Promise<MarketingCampaign | undefined> =>
  tx.run(
    SELECT.one.from(ENTITIES.marketingCampaign).where({ ID: campaignID })
  ) as Promise<MarketingCampaign | undefined>;

export const findPlayerCampaign = async (
  tx: Transaction,
  playerID: string,
  campaignID: string
): Promise<PlayerCampaign | undefined> =>
  tx.run(
    SELECT.one.from(ENTITIES.playerCampaign).where({
      player_ID: playerID,
      campaign_ID: campaignID
    })
  ) as Promise<PlayerCampaign | undefined>;

export const createPlayerCampaign = async (
  tx: Transaction,
  entry: Pick<PlayerCampaign, 'player_ID' | 'campaign_ID' | 'note'>
): Promise<void> => {
  await tx.run(INSERT.into(ENTITIES.playerCampaign).entries(entry));
};
