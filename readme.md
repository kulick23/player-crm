# Player CRM

A CRM for game players built with SAP CAP (Node.js) and a Fiori Elements UI.
SQLite is used locally, SAP HANA Cloud in production.

## Project layout

| Folder / file | Purpose |
|---------|----------|
| `db/` | domain model (`schema.cds`) and sample data (`data/*.csv`) |
| `srv/` | the `PlayerCRMService`: projections, UI annotations, business logic |
| `app/project1/` | Fiori Elements app (List Report / Object Page) |
| `test/` | Jest tests |
| `xs-security.json` | XSUAA scopes and role collections |
| `.github/workflows/ci.yml` | build and tests on push / PR to `main` and `dev` |

## Running locally

```sh
npm install
npm run watch-project1
```

The service starts on <http://localhost:4004> with an in-memory SQLite database,
seeded automatically from `db/data/*.csv`.

## Roles and users

The service requires authentication (`@requires: 'authenticated-user'`), and
per-entity permissions are declared with `@restrict`.

| Role | Permissions |
|------|-------------|
| `CRMAdmin` | full access to every entity, may call `activateVIP` |
| `SupportAgent` | reads everything, edits players, logs interactions and feedback |
| `CommunityManager` | reads everything, full access to marketing campaigns |

The development profile uses mocked users with basic auth (login equals
password): `admin`, `support`, `community`. Production uses XSUAA, where roles
are granted through the role collections defined in `xs-security.json`.

## Status colors

Player status and rating are colored through `UI.Criticality`, driven by the
calculated fields `statusCriticality` and `ratingCriticality` in the projection:

| Value | Color | Condition |
|-------|-------|-----------|
| 3 | green | status `VIP` / `Active`, average rating >= 4 |
| 2 | yellow | status `Inactive`, average rating >= 3 |
| 1 | red | status `AtRisk`, average rating < 3 |
| 0 | grey | unknown status, no rating yet |

## Business logic

- saving a player together with new feedback recalculates `averageRating`;
  if the latest feedback is rated below 3 the player moves to `AtRisk`;
- the `activateVIP(tier)` action creates a loyalty program entry
  (`7days` / `30days` / `90days`) and sets the player's `vipTier`.

Feedback and interactions are composition children of the `Player` draft root,
so they are created together with the player's draft rather than by a separate
POST.

## Tests

```sh
npm test
```

The suite covers the criticality calculations, the per-role permission matrix
and the business logic (rating recalculation, the `AtRisk` transition and
`activateVIP`).

## Branching

GitHub Flow: `main` holds the stable version, `dev` is the integration branch,
and features are developed in `feature/*` branches created from `dev`.
