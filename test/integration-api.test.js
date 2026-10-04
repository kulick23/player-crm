const cds = require('@sap/cds');
const { GET, POST, axios } = cds.test(__dirname + '/..');

axios.defaults.validateStatus = () => true;

const INTEGRATION = { auth: { username: 'integration', password: 'integration' } };
const DANIEL = 'bbbbbbbb-1111-1111-1111-111111111111';

describe('Player integration API', () => {
  test('rejects a regular CRM user', async () => {
    const { status } = await GET('/integration/players/Players', {
      auth: { username: 'admin', password: 'admin' }
    });
    expect(status).toBe(403);
  });

  test('returns a compact player profile to a system user', async () => {
    const { status, data } = await GET(
      `/integration/players/Players(${DANIEL})`,
      INTEGRATION
    );

    expect(status).toBe(200);
    expect(data).toMatchObject({
      ID: DANIEL,
      displayName: 'Daniel',
      statusCode: 'VIP'
    });
  });

  test('creates an order issue for CRM support', async () => {
    const orderID = '99999999-1111-4111-8111-111111111111';
    const { status, data } = await POST(
      '/integration/players/reportOrderIssue',
      {
        orderID,
        playerID: DANIEL,
        categoryCode: 'PRODUCT_NOT_WORKING',
        rating: 2,
        description: 'The purchased item cannot be activated',
        orderDate: '2026-10-04T12:00:00Z',
        orderTotal: 49.9
      },
      INTEGRATION
    );

    expect(status).toBe(200);
    expect(data).toMatchObject({ statusCode: 'OPEN' });
    expect(data.ID).toBeTruthy();

    const duplicate = await POST(
      '/integration/players/reportOrderIssue',
      {
        orderID,
        playerID: DANIEL,
        categoryCode: 'PRODUCT_NOT_WORKING',
        rating: 2,
        description: 'Duplicate report'
      },
      INTEGRATION
    );
    expect(duplicate.status).toBe(409);

    const resolved = await POST(
      `/odata/v4/player-crm/OrderIssues(ID=${data.ID},IsActiveEntity=true)/PlayerCRMService.resolveIssue`,
      { resolutionNote: 'Activation was restored and verified' },
      { auth: { username: 'support', password: 'support' } }
    );
    expect(resolved.status).toBe(200);
    expect(resolved.data).toMatchObject({
      ID: data.ID,
      statusCode: 'RESOLVED',
      resolutionNote: 'Activation was restored and verified'
    });
  });
});
