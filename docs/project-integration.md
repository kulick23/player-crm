# Player CRM and Player Orders integration

The applications keep separate databases and communicate through CAP OData services.
`playerorders.Customer.playerId` is the external reference to `playercrm.Player.ID`.

## Local run

Start CRM first:

```sh
cd /Users/danila/Projets/player-crm
npm run watch-integrated
```

Start Orders in another terminal:

```sh
cd /Users/danila/Projets/player-orders
npm run watch-integrated
```

CRM runs on port `4004`; Orders runs on port `4005`. The `integration` profile uses
the local mocked `system-user` account for service-to-service authentication.

## Exposed contracts

- CRM: `GET /integration/players/Players(<player-id>)`
- Orders: `GET /integration/orders/getPlayerOrderSummary(playerID='<player-id>')`
- Orders customer function: `PlayerOrderService.crmProfile()`
- CRM player function: `PlayerCRMService.orderSummary()`

## SAP BTP destinations

Both srv modules are bound to a Destination service instance. Create these two
subaccount destinations before testing the deployed applications:

### player-crm-api

- Type: `HTTP`
- URL: `https://<player-crm-srv-route>/integration/players`
- Proxy Type: `Internet`
- Authentication: `OAuth2ClientCredentials`
- Client ID and Client Secret: from a service key of `player-crm-auth`
- Token Service URL: `<player-crm-auth-url>/oauth/token`

### player-orders-api

- Type: `HTTP`
- URL: `https://<player-orders-srv-route>/integration/orders`
- Proxy Type: `Internet`
- Authentication: `OAuth2ClientCredentials`
- Client ID and Client Secret: from a service key of `player-orders-auth`
- Token Service URL: `<player-orders-auth-url>/oauth/token`

The integration endpoints require CAP's `system-user` pseudo-role, so ordinary CRM
and Orders users cannot call them directly.
