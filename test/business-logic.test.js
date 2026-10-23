const cds = require('@sap/cds');
const { GET, POST, axios } = cds.test(__dirname + '/..');

axios.defaults.auth = { username: 'admin', password: 'admin' };

const BASE = '/odata/v4/player-crm';
const DANILA = 'bbbbbbbb-1111-1111-1111-111111111111';
const ALEX = 'bbbbbbbb-2222-2222-2222-222222222222';
const MARIA = 'bbbbbbbb-3333-3333-3333-333333333333';
const IGOR = 'bbbbbbbb-4444-4444-4444-444444444444';

const SERVICE_RECOVERY = 'ffffffff-1111-1111-1111-111111111111';
const DOWNTIME_APOLOGY = 'ffffffff-2222-2222-2222-222222222222';

const addDays = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

describe('Action activateVIP', () => {
  test('creates a 30days subscription with the right price and dates', async () => {
    const { status, data } = await POST(
      `${BASE}/Players(ID=${ALEX},IsActiveEntity=true)/PlayerCRMService.activateVIP`,
      { tier: '30days' }
    );

    expect(status).toBe(200);
    expect(data.vipTier).toBe('30days');

    const { data: loyalty } = await GET(
      `${BASE}/LoyaltyPrograms?$filter=player_ID eq ${ALEX} and tier eq '30days'`
    );
    expect(loyalty.value).toHaveLength(1);
    expect(Number(loyalty.value[0].price)).toBe(279);
    expect(loyalty.value[0].startDate).toBe(addDays(0));
    expect(loyalty.value[0].endDate).toBe(addDays(30));
  });

  test('updates the vipTier of the player', async () => {
    await POST(
      `${BASE}/Players(ID=${MARIA},IsActiveEntity=true)/PlayerCRMService.activateVIP`,
      { tier: '7days' }
    );

    const { data: player } = await GET(
      `${BASE}/Players(ID=${MARIA},IsActiveEntity=true)?$select=vipTier`
    );
    expect(player.vipTier).toBe('7days');

    const { data: loyalty } = await GET(
      `${BASE}/LoyaltyPrograms?$filter=player_ID eq ${MARIA} and tier eq '7days'`
    );
    expect(Number(loyalty.value[0].price)).toBe(149);
    expect(loyalty.value[0].endDate).toBe(addDays(7));
  });

  test('sets the player status to VIP and adds days to an active subscription', async () => {
    const { data } = await POST(
      `${BASE}/Players(ID=${ALEX},IsActiveEntity=true)/PlayerCRMService.activateVIP`,
      { tier: '7days' }
    );

    expect(data.statusCode).toBe('VIP');
    expect(data.vipTier).toBe('37days');

    const { data: loyalty } = await GET(
      `${BASE}/LoyaltyPrograms?$filter=player_ID eq ${ALEX}&$orderby=endDate desc`
    );
    expect(loyalty.value[0].endDate).toBe(addDays(37));
  });

  test('cancels VIP and restores the status based on the player rating', async () => {
    const { data } = await POST(
      `${BASE}/Players(ID=${MARIA},IsActiveEntity=true)/PlayerCRMService.cancelVIP`,
      {}
    );

    expect(data.vipTier).toBeNull();
    expect(data.statusCode).toBe('Active');
  });

  test('logs the activation in the interaction history', async () => {
    const { data: before } = await GET(
      `${BASE}/Interactions?$filter=player_ID eq ${ALEX} and type eq 'VipActivated'`
    );
    expect(before.value.length).toBeGreaterThan(0);
    expect(before.value[0].summary).toContain('30days');
  });

  test('an unknown tier is rejected before any subscription is created', async () => {
    try {
      await POST(
        `${BASE}/Players(ID=${DANILA},IsActiveEntity=true)/PlayerCRMService.activateVIP`,
        { tier: 'lifetime' }
      );
      throw new Error('the unknown tier was accepted');
    } catch (err) {
      expect(err.response?.status).toBe(400);
      expect(err.response?.data?.error?.message).toContain('Unknown VIP tier');
    }

    const { data: loyalty } = await GET(
      `${BASE}/LoyaltyPrograms?$filter=player_ID eq ${DANILA} and tier eq 'lifetime'`
    );
    expect(loyalty.value).toHaveLength(0);
  });
});

describe('Action grantCompensation', () => {
  const grant = (player, campaign_ID, note) =>
    POST(
      `${BASE}/Players(ID=${player},IsActiveEntity=true)/PlayerCRMService.grantCompensation`,
      { campaign_ID, note }
    );

  test('a bonus campaign tops up the balance of the player', async () => {
    const { data: before } = await GET(
      `${BASE}/Players(ID=${IGOR},IsActiveEntity=true)?$select=balance`
    );

    const { status } = await grant(IGOR, SERVICE_RECOVERY, 'Broken case drop');
    expect(status).toBe(200);

    const { data: after } = await GET(
      `${BASE}/Players(ID=${IGOR},IsActiveEntity=true)?$select=balance`
    );
    expect(Number(after.balance)).toBe(Number(before.balance) + 50);
  });

  test('the grant is recorded with the note of the agent', async () => {
    const { data } = await GET(
      `${BASE}/CampaignParticipants?$filter=player_ID eq ${IGOR} and campaign_ID eq ${SERVICE_RECOVERY}`
    );
    expect(data.value).toHaveLength(1);
    expect(data.value[0].note).toBe('Broken case drop');
  });

  test('the grant shows up in the interaction history', async () => {
    const { data } = await GET(
      `${BASE}/Interactions?$filter=player_ID eq ${IGOR} and type eq 'CompensationGranted'`
    );
    expect(data.value).toHaveLength(1);
    expect(data.value[0].summary).toContain('50');
  });

  test('the same campaign cannot be granted twice', async () => {
    try {
      await grant(IGOR, SERVICE_RECOVERY, 'Second attempt');
      throw new Error('the duplicate grant was accepted');
    } catch (err) {
      expect(err.response?.status).toBe(400);
      expect(err.response?.data?.error?.message).toContain('already been granted');
    }
  });

  test('a VipDays campaign creates a complimentary loyalty entry', async () => {
    await grant(MARIA, DOWNTIME_APOLOGY, 'Outage during the weekend');

    const { data } = await GET(
      `${BASE}/LoyaltyPrograms?$filter=player_ID eq ${MARIA} and price eq 0`
    );
    expect(data.value).toHaveLength(1);
    expect(data.value[0].tier).toBe('7days');
    expect(data.value[0].perks).toContain('Downtime Apology');
  });

  test('an unknown campaign is rejected', async () => {
    try {
      await grant(ALEX, 'ffffffff-9999-9999-9999-999999999999');
      throw new Error('the unknown campaign was accepted');
    } catch (err) {
      expect(err.response?.status).toBe(404);
    }
  });
});

describe('averageRating recalculation on new feedback', () => {
  const addFeedbackViaDraft = async (playerID, feedback) => {
    await POST(
      `${BASE}/Players(ID=${playerID},IsActiveEntity=true)/PlayerCRMService.draftEdit`,
      { PreserveChanges: true }
    );
    await POST(
      `${BASE}/Players(ID=${playerID},IsActiveEntity=false)/feedbacks`,
      feedback
    );
    return POST(
      `${BASE}/Players(ID=${playerID},IsActiveEntity=false)/PlayerCRMService.draftActivate`,
      {}
    );
  };

  test('average rating is recalculated after feedback is added', async () => {
    await addFeedbackViaDraft(DANILA, { rating: 3, comment: 'Got worse' });

    const { data: player } = await GET(
      `${BASE}/Players(ID=${DANILA},IsActiveEntity=true)?$select=averageRating,ratingCriticality`
    );
    expect(Number(player.averageRating)).toBe(4);
    expect(player.ratingCriticality).toBe(3);
  });

  test('feedback rated below 3 moves the player to AtRisk', async () => {
    await addFeedbackViaDraft(ALEX, { rating: 1, comment: 'Terrible' });

    const { data: player } = await GET(
      `${BASE}/Players(ID=${ALEX},IsActiveEntity=true)?$select=statusCode,statusCriticality,averageRating`
    );
    expect(player.statusCode).toBe('AtRisk');
    expect(player.statusCriticality).toBe(1);
    expect(Number(player.averageRating)).toBe(1.5);
  });

  test('the automatic status change is logged in the interaction history', async () => {
    const { data } = await GET(
      `${BASE}/Interactions?$filter=player_ID eq ${ALEX} and type eq 'StatusChanged'`
    );
    expect(data.value).toHaveLength(1);
    expect(data.value[0].summary).toContain('AtRisk');
  });

  test('the player leaves AtRisk once the average rating recovers', async () => {
    await addFeedbackViaDraft(ALEX, { rating: 5, comment: 'Much better' });
    await addFeedbackViaDraft(ALEX, { rating: 5, comment: 'Great support' });

    const { data: player } = await GET(
      `${BASE}/Players(ID=${ALEX},IsActiveEntity=true)?$select=statusCode,statusCriticality,averageRating`
    );
    expect(Number(player.averageRating)).toBeGreaterThanOrEqual(3);
    expect(player.statusCode).not.toBe('AtRisk');
    expect(player.statusCriticality).toBe(3);
  });

  test('a player holding a subscription returns to VIP rather than Active', async () => {
    const { data: player } = await GET(
      `${BASE}/Players(ID=${ALEX},IsActiveEntity=true)?$select=statusCode,vipTier`
    );
    expect(player.vipTier).toBeTruthy();
    expect(player.statusCode).toBe('VIP');
  });

  test('the recovery is logged in the interaction history as well', async () => {
    const { data } = await GET(
      `${BASE}/Interactions?$filter=player_ID eq ${ALEX} and type eq 'StatusChanged'`
    );
    expect(data.value).toHaveLength(2);
    expect(data.value.some((i) => i.summary.includes('VIP'))).toBe(true);
  });

  test('feedback rated 3 or higher leaves the status unchanged', async () => {
    const { data: before } = await GET(
      `${BASE}/Players(ID=${MARIA},IsActiveEntity=true)?$select=statusCode`
    );
    await addFeedbackViaDraft(MARIA, { rating: 5, comment: 'All good' });

    const { data: after } = await GET(
      `${BASE}/Players(ID=${MARIA},IsActiveEntity=true)?$select=statusCode,averageRating`
    );
    expect(after.statusCode).toBe(before.statusCode);
    expect(Number(after.averageRating)).toBe(5);
  });
});
