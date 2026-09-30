import cds, { Request, Service } from '@sap/cds';
import type { Feedback, Player } from '#cds-models/PlayerCRMService';

import { applyActionVisibility, applyRatingCriticality } from './domain/presentation';
import { AT_RISK_THRESHOLD, isTier, VIP_TIERS } from './domain/player';
import { findCampaign, findPlayerCampaign } from './repositories/campaign-repository';
import { findPlayer } from './repositories/player-repository';
import { activateVIP } from './services/vip-service';
import { grantCompensation } from './services/compensation-service';
import { getPlayerStats } from './services/player-query-service';
import { syncPlayerRating } from './services/player-rating-service';
import { boundPlayerID, campaignIDFrom, readPlayer } from './utils/request';

const { SELECT } = cds.ql;

export = (srv: Service) => {
  srv.after('READ', 'Players', (players: unknown, req: Request) => {
    applyRatingCriticality(players, 'averageRating');
    applyActionVisibility(players, req.user);
  });

  srv.after('READ', 'Feedbacks', (feedbacks: unknown) => {
    applyRatingCriticality(feedbacks, 'rating');
  });

  srv.after('CREATE', 'Feedbacks', async (result: unknown, req: Request) => {
    const feedback = result as Feedback;
    await syncPlayerRating(cds.tx(req), feedback.player_ID);
  });

  srv.after('SAVE', 'Players', async (result: unknown, req: Request) => {
    const player = result as Player;
    const changes = await syncPlayerRating(cds.tx(req), player.ID);
    if (changes) Object.assign(player, changes);
  });

  srv.on('stats', 'Players', async (req: Request) => {
    const playerID = boundPlayerID(req);
    const stats = await getPlayerStats(cds.tx(req), playerID);
    if (!stats) return req.reject(404, `Player ${playerID} not found`);
    return stats;
  });

  srv.on('atRiskPlayers', async (req: Request) => {
    const threshold = Number(req.data.minRating ?? AT_RISK_THRESHOLD);
    return cds.tx(req).run(
      SELECT.from(srv.entities.Players)
        .columns('ID', 'displayName', 'statusCode', 'averageRating')
        .where`averageRating < ${threshold} or statusCode = 'AtRisk'`
        .orderBy('averageRating asc')
    );
  });

  srv.before('activateVIP', 'Players', (req: Request) => {
    if (!isTier(req.data.tier)) {
      return req.reject(
        400,
        `Unknown VIP tier "${req.data.tier}". Expected one of: ${Object.keys(VIP_TIERS).join(', ')}`
      );
    }
  });

  srv.on('activateVIP', 'Players', async (req: Request) => {
    const playerID = boundPlayerID(req);
    const tier = req.data.tier;
    if (!isTier(tier)) return req.reject(400, 'A valid VIP tier is required');

    const tx = cds.tx(req);
    await activateVIP(tx, playerID, tier);
    return readPlayer(srv, tx, playerID);
  });

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
