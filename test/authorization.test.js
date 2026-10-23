const cds = require('@sap/cds');
const { GET, POST, DELETE, axios } = cds.test(__dirname + '/..');

axios.defaults.validateStatus = () => true;

const BASE = '/odata/v4/player-crm';
const as = (user) => ({ auth: { username: user, password: user } });

const ALEX = 'bbbbbbbb-2222-2222-2222-222222222222';
const MARIA = 'bbbbbbbb-3333-3333-3333-333333333333';

describe('Authorization: the service requires authentication', () => {
  test('anonymous request is rejected with 401', async () => {
    const { status } = await GET(`${BASE}/Players`);
    expect(status).toBe(401);
  });

  test('wrong password is rejected with 401', async () => {
    const { status } = await GET(`${BASE}/Players`, {
      auth: { username: 'admin', password: 'wrong' }
    });
    expect(status).toBe(401);
  });

  test.each(['admin', 'support', 'community'])('%s can read Players', async (user) => {
    const { status } = await GET(`${BASE}/Players`, as(user));
    expect(status).toBe(200);
  });
});

describe('Authorization: CRMAdmin', () => {
  test('can delete a player', async () => {
    const { status } = await DELETE(
      `${BASE}/Players(ID=${MARIA},IsActiveEntity=true)`,
      as('admin')
    );
    expect(status).toBe(204);
  });

  test('can create a campaign', async () => {
    const { status } = await POST(
      `${BASE}/MarketingCampaigns`,
      { name: 'Admin Campaign' },
      as('admin')
    );
    expect(status).toBe(201);
  });
});

describe('Authorization: SupportAgent', () => {
  test('cannot delete a player', async () => {
    const { status } = await DELETE(
      `${BASE}/Players(ID=${ALEX},IsActiveEntity=true)`,
      as('support')
    );
    expect(status).toBe(403);
  });

  test('cannot call activateVIP', async () => {
    const { status } = await POST(
      `${BASE}/Players(ID=${ALEX},IsActiveEntity=true)/PlayerCRMService.activateVIP`,
      { tier: '30days' },
      as('support')
    );
    expect(status).toBe(403);
  });

  test('cannot create a campaign', async () => {
    const { status } = await POST(
      `${BASE}/MarketingCampaigns`,
      { name: 'Support Campaign' },
      as('support')
    );
    expect(status).toBe(403);
  });

  test('can read campaigns', async () => {
    const { status } = await GET(`${BASE}/MarketingCampaigns`, as('support'));
    expect(status).toBe(200);
  });

  test('can grant a compensation to a player', async () => {
    const { status } = await POST(
      `${BASE}/Players(ID=${ALEX},IsActiveEntity=true)/PlayerCRMService.grantCompensation`,
      { campaign_ID: 'ffffffff-3333-3333-3333-333333333333', note: 'Player went quiet' },
      as('support')
    );
    expect(status).toBe(200);
  });

  test('can edit a player and log an interaction through a draft', async () => {
    const edit = await POST(
      `${BASE}/Players(ID=${ALEX},IsActiveEntity=true)/PlayerCRMService.draftEdit`,
      { PreserveChanges: true },
      as('support')
    );
    expect(edit.status).toBe(201);

    const created = await POST(
      `${BASE}/Players(ID=${ALEX},IsActiveEntity=false)/interactions`,
      { type: 'SupportTicket', summary: 'Case never arrived' },
      as('support')
    );
    expect(created.status).toBe(201);

    const saved = await POST(
      `${BASE}/Players(ID=${ALEX},IsActiveEntity=false)/PlayerCRMService.draftActivate`,
      {},
      as('support')
    );
    expect(saved.status).toBe(200);
  });
});

describe('Authorization: CommunityManager', () => {
  test('can create a campaign', async () => {
    const { status } = await POST(
      `${BASE}/MarketingCampaigns`,
      { name: 'Summer Event' },
      as('community')
    );
    expect(status).toBe(201);
  });

  test('cannot edit a player (no UPDATE on Players)', async () => {
    const { status } = await POST(
      `${BASE}/Players(ID=${ALEX},IsActiveEntity=true)/PlayerCRMService.draftEdit`,
      { PreserveChanges: true },
      as('community')
    );
    expect(status).toBe(403);
  });

  test('cannot create feedback', async () => {
    const { status } = await POST(
      `${BASE}/Feedbacks`,
      { rating: 5, comment: 'x', player_ID: ALEX },
      as('community')
    );
    expect(status).toBe(403);
  });

  test('cannot call activateVIP', async () => {
    const { status } = await POST(
      `${BASE}/Players(ID=${ALEX},IsActiveEntity=true)/PlayerCRMService.activateVIP`,
      { tier: '7days' },
      as('community')
    );
    expect(status).toBe(403);
  });

  test('cannot grant a compensation', async () => {
    const { status } = await POST(
      `${BASE}/Players(ID=${ALEX},IsActiveEntity=true)/PlayerCRMService.grantCompensation`,
      { campaign_ID: 'ffffffff-1111-1111-1111-111111111111' },
      as('community')
    );
    expect(status).toBe(403);
  });

  test('can add participants through the campaign draft', async () => {
    const campaign = 'ffffffff-4444-4444-4444-444444444444';

    const edit = await POST(
      `${BASE}/MarketingCampaigns(ID=${campaign},IsActiveEntity=true)/PlayerCRMService.draftEdit`,
      { PreserveChanges: true },
      as('community')
    );
    expect(edit.status).toBe(201);

    const added = await POST(
      `${BASE}/MarketingCampaigns(ID=${campaign},IsActiveEntity=false)/participants`,
      { player_ID: MARIA, note: 'Selected for the discount wave' },
      as('community')
    );
    expect(added.status).toBe(201);

    const saved = await POST(
      `${BASE}/MarketingCampaigns(ID=${campaign},IsActiveEntity=false)/PlayerCRMService.draftActivate`,
      {},
      as('community')
    );
    expect(saved.status).toBe(200);
  });
});
