const cds = require('@sap/cds');
const { GET, axios } = cds.test(__dirname + '/..');

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
});
