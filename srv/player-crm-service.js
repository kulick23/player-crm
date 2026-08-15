const cds = require('@sap/cds');

const VIP_TIERS = {
  '7days':  { price: 149.00, days: 7 },
  '30days': { price: 279.00, days: 30 },
  '90days': { price: 599.00, days: 90 }
};

const isoDate = (date) => date.toISOString().slice(0, 10);

const syncPlayerRating = async (player_ID) => {
  if (!player_ID) return null;

  const db = cds.entities('playercrm');
  const feedbacks = await SELECT.from(db.Feedback).where({ player_ID });
  if (!feedbacks.length) return null;

  const changes = {
    averageRating: feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
  };

  const latest = feedbacks.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
  if (latest.rating < 3) {
    const atRisk = await SELECT.one.from(db.PlayerStatus).where({ code: 'AtRisk' });
    if (atRisk) changes.status_ID = atRisk.ID;
  }

  await UPDATE(db.Player, player_ID).with(changes);
  return changes;
};

module.exports = (srv) => {

  srv.after('CREATE', 'Feedbacks', async (feedback) => {
    await syncPlayerRating(feedback.player_ID);
  });

  srv.after('SAVE', 'Players', async (player) => {
    const changes = await syncPlayerRating(player?.ID);
    if (changes) Object.assign(player, changes);
  });

  srv.on('stats', 'Players', async (req) => {
    const db = cds.entities('playercrm');
    const player_ID = req.params[0].ID;

    const player = await SELECT.one.from(db.Player).where({ ID: player_ID });
    if (!player) return req.reject(404, `Player ${player_ID} not found`);

    const [feedbacks, interactions, loyalty] = await Promise.all([
      SELECT.from(db.Feedback).where({ player_ID }),
      SELECT.from(db.Interaction).where({ player_ID }),
      SELECT.from(db.LoyaltyProgram).where({ player_ID })
    ]);

    return {
      feedbackCount: feedbacks.length,
      interactionCount: interactions.length,
      loyaltyTotal: loyalty.reduce((sum, l) => sum + Number(l.price ?? 0), 0),
      averageRating: player.averageRating,
      activeSince: player.createdAt
    };
  });

  srv.on('atRiskPlayers', async (req) => {
    const threshold = req.data.minRating ?? 3;

    return SELECT
      .from(srv.entities.Players)
      .columns('ID', 'displayName', 'statusCode', 'averageRating')
      .where`averageRating < ${threshold} or statusCode = 'AtRisk'`
      .orderBy('averageRating asc');
  });

  srv.on('activateVIP', 'Players', async (req) => {
    const db = cds.entities('playercrm');
    const playerID = req.params[0].ID;
    const { tier } = req.data;

    const { price = 0, days = 0 } = VIP_TIERS[tier] ?? {};

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);

    await INSERT.into(db.LoyaltyProgram).entries({
      player_ID: playerID,
      tier,
      startDate: isoDate(startDate),
      endDate: isoDate(endDate),
      price,
      perks: 'Market discount, access to exclusive cases'
    });

    await UPDATE(db.Player, playerID).with({ vipTier: tier });

    return await SELECT.one.from(db.Player).where({ ID: playerID });
  });

};
