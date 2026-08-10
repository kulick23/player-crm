const cds = require('@sap/cds');
const { GET, POST, axios } = cds.test(__dirname + '/..');

axios.defaults.auth = { username: 'admin', password: 'admin' };

const BASE = '/odata/v4/player-crm';
const DANILA = 'bbbbbbbb-1111-1111-1111-111111111111';
const ALEX = 'bbbbbbbb-2222-2222-2222-222222222222';
const MARIA = 'bbbbbbbb-3333-3333-3333-333333333333';

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

  test('an unknown tier results in price 0', async () => {
    await POST(
      `${BASE}/Players(ID=${DANILA},IsActiveEntity=true)/PlayerCRMService.activateVIP`,
      { tier: 'lifetime' }
    );

    const { data: loyalty } = await GET(
      `${BASE}/LoyaltyPrograms?$filter=player_ID eq ${DANILA} and tier eq 'lifetime'`
    );
    expect(loyalty.value).toHaveLength(1);
    expect(Number(loyalty.value[0].price)).toBe(0);
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
