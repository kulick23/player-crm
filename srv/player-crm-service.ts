import cds, { Service, Request } from '@sap/cds';

import { applyActionVisibility, applyRatingCriticality } from './lib/criticality';
import { Tier, VIP_TIERS, isoDate, logInteraction, syncPlayerRating } from './lib/players';

export = (srv: Service) => {
  srv.after('READ', 'Players', (players: unknown, req: Request) => {
    applyRatingCriticality(players, 'averageRating');
    applyActionVisibility(players, req.user);
  });

  srv.after('READ', 'Feedbacks', (feedbacks: unknown) =>
    applyRatingCriticality(feedbacks, 'rating')
  );

  srv.after('CREATE', 'Feedbacks', async (feedback: any) => {
    await syncPlayerRating(feedback.player_ID);
  });

  srv.after('SAVE', 'Players', async (player: any) => {
    const changes = await syncPlayerRating(player?.ID);
    if (changes) Object.assign(player, changes);
  });

  srv.on('stats', 'Players', async (req: Request) => {
    const { Player, Feedback, Interaction, LoyaltyProgram } = cds.entities('playercrm');
    const { ID: player_ID } = req.params[0] as { ID: string };

    const player = await SELECT.one.from(Player).where({ ID: player_ID });
    if (!player) return req.reject(404, `Player ${player_ID} not found`);

    const [feedbacks, interactions, loyalty] = await Promise.all([
      SELECT.from(Feedback).where({ player_ID }),
      SELECT.from(Interaction).where({ player_ID }),
      SELECT.from(LoyaltyProgram).where({ player_ID })
    ]);

    return {
      feedbackCount: feedbacks.length,
      interactionCount: interactions.length,
      loyaltyTotal: loyalty.reduce((sum: number, l: any) => sum + Number(l.price ?? 0), 0),
      averageRating: player.averageRating,
      activeSince: player.createdAt
    };
  });

  srv.on('atRiskPlayers', async (req: Request) => {
    const threshold = (req.data.minRating as number) ?? 3;

    return SELECT.from(srv.entities.Players)
      .columns('ID', 'displayName', 'statusCode', 'averageRating')
      .where`averageRating < ${threshold} or statusCode = 'AtRisk'`
      .orderBy('averageRating asc');
  });

  srv.before('activateVIP', 'Players', (req: Request) => {
    const tier = req.data.tier as string;
    if (!tier || !(tier in VIP_TIERS)) {
      return req.reject(
        400,
        `Unknown VIP tier "${tier}". Expected one of: ${Object.keys(VIP_TIERS).join(', ')}`
      );
    }
  });

  srv.before('grantCompensation', 'Players', async (req: Request) => {
    const { MarketingCampaign, PlayerCampaigns } = cds.entities('playercrm');
    const { ID: playerID } = req.params[0] as { ID: string };
    const campaign_ID = req.data.campaign_ID as string;

    if (!campaign_ID) return req.reject(400, 'A campaign has to be selected');

    const campaign = await SELECT.one.from(MarketingCampaign).where({ ID: campaign_ID });
    if (!campaign) return req.reject(404, `Campaign ${campaign_ID} not found`);

    const granted = await SELECT.one
      .from(PlayerCampaigns)
      .where({ player_ID: playerID, campaign_ID });
    if (granted) {
      return req.reject(400, `${campaign.name} has already been granted to this player`);
    }
  });

  srv.on('grantCompensation', 'Players', async (req: Request) => {
    const { Player, MarketingCampaign, PlayerCampaigns, LoyaltyProgram } = cds.entities('playercrm');
    const { ID: playerID } = req.params[0] as { ID: string };
    const campaign_ID = req.data.campaign_ID as string;
    const note = req.data.note as string;

    const campaign = await SELECT.one.from(MarketingCampaign).where({ ID: campaign_ID });

    const player = await SELECT.one.from(Player).where({ ID: playerID });
    if (!player) return req.reject(404, `Player ${playerID} not found`);

    const value = Number(campaign.compensationValue ?? 0);
    let summary = `${campaign.name} granted`;

    if (campaign.compensationType === 'Bonus') {
      await UPDATE(Player, playerID).with({ balance: Number(player.balance ?? 0) + value });
      summary = `${campaign.name}: ${value} added to the balance`;
    }

    if (campaign.compensationType === 'VipDays') {
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + value);

      const tier = `${value}days`;
      await INSERT.into(LoyaltyProgram).entries({
        player_ID: playerID,
        tier,
        startDate: isoDate(startDate),
        endDate: isoDate(endDate),
        price: 0,
        perks: `Complimentary access granted by ${campaign.name}`
      });
      await UPDATE(Player, playerID).with({ vipTier: tier });
      summary = `${campaign.name}: ${value} complimentary VIP days`;
    }

    if (campaign.compensationType === 'Discount') {
      summary = `${campaign.name}: ${value}% discount on the next purchase`;
    }

    await INSERT.into(PlayerCampaigns).entries({
      player_ID: playerID,
      campaign_ID,
      note: note || null
    });

    await logInteraction(playerID, 'CompensationGranted', summary);

    return await SELECT.one.from(srv.entities.Players).where({ ID: playerID });
  });

  srv.on('activateVIP', 'Players', async (req: Request) => {
    const { Player, LoyaltyProgram } = cds.entities('playercrm');
    const { ID: playerID } = req.params[0] as { ID: string };
    const tier = req.data.tier as Tier;

    const { price = 0, days = 0 } = VIP_TIERS[tier] ?? {};

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);

    await INSERT.into(LoyaltyProgram).entries({
      player_ID: playerID,
      tier,
      startDate: isoDate(startDate),
      endDate: isoDate(endDate),
      price,
      perks: 'Market discount, access to exclusive cases'
    });

    await UPDATE(Player, playerID).with({ vipTier: tier });

    await logInteraction(
      playerID,
      'VipActivated',
      `VIP subscription ${tier} activated until ${isoDate(endDate)}`
    );

    return await SELECT.one.from(srv.entities.Players).where({ ID: playerID });
  });
};
