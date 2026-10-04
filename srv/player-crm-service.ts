import cds, { Request, Service } from '@sap/cds';
import type { Feedback, Player } from '#cds-models/PlayerCRMService';

import { applyActionVisibility, applyRatingCriticality } from './domain/presentation';
import { AT_RISK_THRESHOLD, isTier, PLAYER_STATUSES, VIP_TIERS } from './domain/player';
import { ORDER_ISSUE_STATUSES } from './domain/order-issues';
import { findCampaign, findPlayerCampaign } from './repositories/campaign-repository';
import { findPlayer, findStatusByCode } from './repositories/player-repository';
import {
  findIssueStatus,
  findOrderIssue,
  updateOrderIssue
} from './repositories/order-issue-repository';
import { activateVIP, cancelVIP } from './services/vip-service';
import { grantCompensation } from './services/compensation-service';
import { logInteraction } from './services/interaction-service';
import { getOrderSummary } from './services/order-integration-service';
import { getPlayerStats } from './services/player-query-service';
import { syncPlayerRating } from './services/player-rating-service';
import { boundPlayerID, campaignIDFrom, readPlayer } from './utils/request';

const { SELECT } = cds.ql;

export = (srv: Service) => {
  srv.on('READ', 'VIPDurations', () =>
    Object.entries(VIP_TIERS).map(([code, definition]) => ({
      code,
      label: `${definition.days} days`,
      days: definition.days,
      price: definition.price
    }))
  );

  srv.before('NEW', 'Players', async (req: Request) => {
    if (req.data.status_ID) return;
    const activeStatus = await findStatusByCode(cds.tx(req), PLAYER_STATUSES.active);
    if (activeStatus?.ID) req.data.status_ID = activeStatus.ID;
  });

  srv.after('READ', 'Players', (players: unknown, req: Request) => {
    applyRatingCriticality(players, 'averageRating');
    applyActionVisibility(players, req.user);
  });

  srv.after('READ', 'Feedbacks', (feedbacks: unknown) => {
    applyRatingCriticality(feedbacks, 'rating');
  });

  srv.on('resolveIssue', 'OrderIssues', async (req: Request) => {
    const issueID = String(req.params[0]?.ID ?? '');
    const resolutionNote = String(req.data.resolutionNote ?? '').trim();
    const campaignID = req.data.campaign_ID
      ? String(req.data.campaign_ID)
      : null;
    if (!resolutionNote) return req.reject(400, 'Resolution note is required');

    const tx = cds.tx(req);
    const [issue, resolvedStatus] = await Promise.all([
      findOrderIssue(tx, issueID),
      findIssueStatus(tx, ORDER_ISSUE_STATUSES.resolved)
    ]);
    if (!issue) return req.reject(404, `Order issue ${issueID} not found`);
    if (!resolvedStatus) return req.reject(500, 'Resolved issue status is not configured');
    if (issue.status_code === ORDER_ISSUE_STATUSES.resolved) {
      return req.reject(400, 'The order issue is already resolved');
    }

    if (campaignID) {
      const [campaign, player, existingGrant] = await Promise.all([
        findCampaign(tx, campaignID),
        findPlayer(tx, issue.player_ID),
        findPlayerCampaign(tx, issue.player_ID, campaignID)
      ]);
      if (!campaign) return req.reject(404, `Campaign ${campaignID} not found`);
      if (!player) return req.reject(404, `Player ${issue.player_ID} not found`);
      if (existingGrant) {
        return req.reject(400, `${campaign.name} has already been granted to this player`);
      }
      await grantCompensation(tx, {
        campaign,
        note: `Order issue ${issueID}: ${resolutionNote}`,
        playerBalance: Number(player.balance ?? 0),
        playerID: issue.player_ID
      });
    }

    await updateOrderIssue(tx, issueID, {
      status_code: ORDER_ISSUE_STATUSES.resolved,
      resolutionNote,
      compensationCampaign_ID: campaignID,
      resolvedAt: new Date().toISOString(),
      resolvedBy: req.user.id
    });
    await logInteraction(
      tx,
      issue.player_ID,
      'OrderIssueResolved',
      `Issue ${issueID} resolved${campaignID ? ' with compensation' : ''}`
    );

    return tx.run(
      SELECT.one.from(srv.entities.OrderIssues).where({ ID: issueID })
    );
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

  srv.on('orderSummary', 'Players', async (req: Request) => {
    return getOrderSummary(boundPlayerID(req));
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

  srv.on('cancelVIP', 'Players', async (req: Request) => {
    const playerID = boundPlayerID(req);
    const tx = cds.tx(req);
    const player = await findPlayer(tx, playerID);
    if (!player) return req.reject(404, `Player ${playerID} not found`);
    if (!player.vipTier) return req.reject(400, 'The player has no active VIP subscription');

    await cancelVIP(tx, playerID);
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
