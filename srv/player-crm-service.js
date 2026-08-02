const cds = require('@sap/cds');

module.exports = (srv) => {

  srv.after('CREATE', 'Feedbacks', async (feedback, req) => {
    const db = cds.entities('playercrm');
    const { player_ID, rating } = feedback;

    if (!player_ID) return;

    const allFeedbacks = await SELECT.from(db.Feedback).where({ player_ID });
    const avg = allFeedbacks.reduce((sum, f) => sum + f.rating, 0) / allFeedbacks.length;

    await UPDATE(db.Player, player_ID).with({ averageRating: avg });

    if (rating < 3) {
      const atRiskStatus = await SELECT.one.from(db.PlayerStatus).where({ code: 'AtRisk' });
      if (atRiskStatus) {
        await UPDATE(db.Player, player_ID).with({ status_ID: atRiskStatus.ID });
      }
    }
  });

  srv.on('activateVIP', 'Players', async (req) => {
    const db = cds.entities('playercrm');
    const playerID = req.params[0].ID;
    const { tier } = req.data;

    const priceMap = { '7days': 149.00, '30days': 279.00, '90days': 599.00 };
    const price = priceMap[tier] || 0;

    const today = new Date();
    const endDate = new Date(today);
    if (tier === '7days') endDate.setDate(endDate.getDate() + 7);
    if (tier === '30days') endDate.setDate(endDate.getDate() + 30);
    if (tier === '90days') endDate.setDate(endDate.getDate() + 90);

    await INSERT.into(db.LoyaltyProgram).entries({
      player_ID: playerID,
      tier,
      startDate: today.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
      price,
      perks: 'Market discount, access to exclusive cases'
    });

    await UPDATE(db.Player, playerID).with({ vipTier: tier });

    return await SELECT.one.from(db.Player).where({ ID: playerID });
  });

};