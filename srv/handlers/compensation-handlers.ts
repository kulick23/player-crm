import cds, { Request, Service } from '@sap/cds';

import { findCampaign, findPlayerCampaign } from '../repositories/campaign-repository';
import { findPlayer } from '../repositories/player-repository';
import { grantCompensation } from '../services/compensation-service';
import { boundPlayerID, readPlayer } from './request';

const campaignIDFrom = (req: Request): string => {
  const campaignID = req.data.campaign_ID as string | undefined;
  if (!campaignID) req.reject(400, 'A campaign has to be selected');
  return campaignID;
};

export const registerCompensationHandlers = (srv: Service): void => {
  srv.before('grantCompensation', 'Players', async (req: Request) => {
    const playerID = boundPlayerID(req);
    const campaignID = campaignIDFrom(req);
    const tx = cds.tx(req);
    const campaign = await findCampaign(tx, campaignID);

    if (!campaign) return req.reject(404, `Campaign ${campaignID} not found`);

    const existingGrant = await findPlayerCampaign(tx, playerID, campaignID);
    if (existingGrant) {
      return req.reject(400, `${campaign.name} has already been granted to this player`);
    }
  });

  srv.on('grantCompensation', 'Players', async (req: Request) => {
    const playerID = boundPlayerID(req);
    const campaignID = campaignIDFrom(req);
    const tx = cds.tx(req);
    const [campaign, player] = await Promise.all([
      findCampaign(tx, campaignID),
      findPlayer(tx, playerID)
    ]);

    if (!campaign) return req.reject(404, `Campaign ${campaignID} not found`);
    if (!player) return req.reject(404, `Player ${playerID} not found`);

    await grantCompensation(tx, {
      campaign,
      note: req.data.note as string | undefined,
      playerBalance: Number(player.balance ?? 0),
      playerID
    });
    return readPlayer(srv, tx, playerID);
  });
};
