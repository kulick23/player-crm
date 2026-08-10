const cds = require('@sap/cds');
const { GET, axios } = cds.test(__dirname + '/..');

axios.defaults.auth = { username: 'admin', password: 'admin' };

const BASE = '/odata/v4/player-crm';

describe('Criticality: player status', () => {
  let players;

  beforeAll(async () => {
    const { data } = await GET(
      `${BASE}/Players?$select=displayName,statusCode,statusCriticality,averageRating,ratingCriticality`
    );
    players = Object.fromEntries(data.value.map((p) => [p.statusCode, p]));
  });

  test.each([
    ['VIP', 3],
    ['Active', 3],
    ['Inactive', 2],
    ['AtRisk', 1]
  ])('status %s maps to criticality %i', (code, expected) => {
    expect(players[code]).toBeDefined();
    expect(players[code].statusCriticality).toBe(expected);
  });
});

describe('Criticality: average player rating', () => {
  const ratingCriticality = async (id) => {
    const { data } = await GET(
      `${BASE}/Players(ID=${id},IsActiveEntity=true)?$select=averageRating,ratingCriticality`
    );
    return data;
  };

  test('rating 5.0 is positive', async () => {
    const p = await ratingCriticality('bbbbbbbb-1111-1111-1111-111111111111');
    expect(p.ratingCriticality).toBe(3);
  });

  test('rating 3.5 is critical', async () => {
    const p = await ratingCriticality('bbbbbbbb-3333-3333-3333-333333333333');
    expect(p.ratingCriticality).toBe(2);
  });

  test('rating 2.0 is negative', async () => {
    const p = await ratingCriticality('bbbbbbbb-2222-2222-2222-222222222222');
    expect(p.ratingCriticality).toBe(1);
  });

  test('no rating is neutral', async () => {
    const { data } = await GET(`${BASE}/MarketingCampaigns`);
    expect(data).toBeDefined();

    const { data: created } = await GET(
      `${BASE}/Players?$filter=averageRating eq null&$select=ratingCriticality`
    );
    created.value.forEach((p) => expect(p.ratingCriticality).toBe(0));
  });
});

describe('Criticality: feedback rating', () => {
  test.each([
    [5, 3],
    [2, 1]
  ])('feedback rated %i maps to criticality %i', async (rating, expected) => {
    const { data } = await GET(
      `${BASE}/Feedbacks?$select=rating,ratingCriticality&$filter=rating eq ${rating}`
    );
    expect(data.value.length).toBeGreaterThan(0);
    data.value.forEach((f) => expect(f.ratingCriticality).toBe(expected));
  });
});
