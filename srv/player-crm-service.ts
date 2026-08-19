import cds, { Service, Request } from '@sap/cds';

type Tier = '7days' | '30days' | '90days';

interface TierDefinition {
  price: number;
  days: number;
}

interface PlayerChanges {
  averageRating: number;
  status_ID?: string;
}

const VIP_TIERS: Record<Tier, TierDefinition> = {
  '7days': { price: 149.0, days: 7 },
  '30days': { price: 279.0, days: 30 },
  '90days': { price: 599.0, days: 90 }
};

const isoDate = (date: Date): string => date.toISOString().slice(0, 10);

const ratingCriticality = (rating: unknown): number => {
  if (rating === null || rating === undefined) return 0;
  const value = Number(rating);
  if (value >= 4) return 3;
  if (value >= 3) return 2;
  return 1;
};

const applyActionVisibility = (rows: unknown, user: any): void => {
  const isAdmin = user.is('CRMAdmin');
  const isSupport = user.is('SupportAgent');
  const list = Array.isArray(rows) ? rows : [rows];
  for (const row of list) {
    if (row && typeof row === 'object') {
      (row as Record<string, unknown>).hideActivateVIP = !isAdmin;
      (row as Record<string, unknown>).hideGrantCompensation = !(isAdmin || isSupport);
    }
  }
};

const applyRatingCriticality = (rows: unknown, source: string): void => {
  const list = Array.isArray(rows) ? rows : [rows];
  for (const row of list) {
    if (row && typeof row === 'object' && source in row) {
      (row as Record<string, unknown>).ratingCriticality = ratingCriticality(
        (row as Record<string, unknown>)[source]
      );
    }
  }
};

const logInteraction = async (player_ID: string, type: string, summary: string): Promise<void> => {
  const { Interaction } = cds.entities('playercrm');
  await INSERT.into(Interaction).entries({
    player_ID,
    type,
    date: new Date().toISOString(),
    summary
  });
};

const syncPlayerRating = async (player_ID?: string): Promise<PlayerChanges | null> => {
  if (!player_ID) return null;

  const { Feedback, Player, PlayerStatus } = cds.entities('playercrm');
  const feedbacks = await SELECT.from(Feedback).where({ player_ID });
  if (!feedbacks.length) return null;

  const changes: PlayerChanges = {
    averageRating:
      feedbacks.reduce((sum: number, f: any) => sum + f.rating, 0) / feedbacks.length
  };

  const latest = feedbacks.reduce((a: any, b: any) => (a.createdAt > b.createdAt ? a : b));
  if (latest.rating < 3) {
    const atRisk = await SELECT.one.from(PlayerStatus).where({ code: 'AtRisk' });
    if (atRisk) changes.status_ID = atRisk.ID;
  }

  const player = await SELECT.one.from(Player).where({ ID: player_ID });
  await UPDATE(Player, player_ID).with(changes);

  if (changes.status_ID && changes.status_ID !== player?.status_ID) {
    await logInteraction(
      player_ID,
      'StatusChanged',
      `Moved to AtRisk after a rating of ${latest.rating}`
    );
  }

  return changes;
};

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

  srv.on('grantCompensation', 'Players', async (req: Request) => {
    const { Player, MarketingCampaign, PlayerCampaigns, LoyaltyProgram } = cds.entities('playercrm');
    const { ID: playerID } = req.params[0] as { ID: string };
    const campaign_ID = req.data.campaign_ID as string;
    const note = req.data.note as string;

    const campaign = await SELECT.one.from(MarketingCampaign).where({ ID: campaign_ID });
    if (!campaign) return req.reject(404, `Campaign ${campaign_ID} not found`);

    const player = await SELECT.one.from(Player).where({ ID: playerID });
    if (!player) return req.reject(404, `Player ${playerID} not found`);

    const granted = await SELECT.one
      .from(PlayerCampaigns)
      .where({ player_ID: playerID, campaign_ID });
    if (granted) {
      return req.reject(400, `${campaign.name} has already been granted to this player`);
    }

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

      await INSERT.into(LoyaltyProgram).entries({
        player_ID: playerID,
        tier: `${value}days`,
        startDate: isoDate(startDate),
        endDate: isoDate(endDate),
        price: 0,
        perks: `Complimentary access granted by ${campaign.name}`
      });
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
