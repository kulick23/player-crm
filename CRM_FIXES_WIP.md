# Player CRM fixes: work in progress

Temporary handoff note. Do not commit or deploy this file with the product changes.

## Where work stopped

- Branch: `dev`
- Last committed revision before these fixes: `c6fb038 feat: integrate player CRM with orders`
- The fixes below are present only in the local working tree.
- Nothing from this batch has been committed, pushed, or deployed.

## Reported problems

1. VIP fields and status refresh only after reloading the page.
2. The Activate VIP dialog accepts free text, although only 7, 30, or 90 days are valid.
3. Activating VIP again or granting VIP days as compensation replaces the displayed VIP term instead of extending it.
4. There is no Cancel VIP action.
5. Player email is not required.
6. A new player can be saved without a status, and the status selector is not usable as expected.
7. Activating VIP does not immediately set the player status to `VIP`.
8. Adding low feedback does not immediately show the recalculated rating and `AtRisk` status.

## Changes already implemented locally

- `email` and `status` are marked mandatory in the data model.
- A new player draft receives `Active` as its default status.
- Added the read-only `VIPDurations` value list with 7, 30, and 90 day options.
- Added value-help annotations for the Activate VIP dialog.
- Added explicit Fiori side effects for VIP activation, cancellation, compensation, and related fields.
- Added the `cancelVIP` bound action and its object-page button.
- Added visibility logic so Cancel VIP is shown only to admins for players with VIP.
- VIP activation now sets status to `VIP`.
- Repeated VIP grants extend the latest active expiry date and display the total remaining days.
- VIP days granted as compensation use the same extension logic.
- Cancelling VIP expires active loyalty records, clears the VIP value, and sets status to `Active` or `AtRisk` based on rating.
- Rating synchronization now returns `statusCode` along with persisted changes for immediate UI refresh.
- Added initial tests for VIP extension, status update, and cancellation.
- English and Russian labels for duration and Cancel VIP were added.

## Verification already performed

- Dependencies were restored with `npm install`.
- CDS compilation of the service succeeded.
- Full metadata compilation succeeded before the final annotation cleanup and confirmed:
  - Activate VIP has a fixed value list backed by `VIPDurations`.
  - Cancel VIP is exposed as a bound action.
  - Side-effect annotations are present.
- The first test attempt could not start the local HTTP listener because the sandbox denied `0.0.0.0`; this was an environment restriction, not a test assertion failure.
- A later annotation warning about directly annotating generated `status_ID` was removed, but compilation has not yet been rerun after that final edit.

## Next steps when resuming CRM

1. Re-run full CDS metadata compilation and confirm there are no warnings.
2. Run the full Jest suite with permission to open the local test listener.
3. Fix any real compilation or test failures.
4. Add tests for mandatory email and default/selected player status during draft creation.
5. Consider adding authorization tests for `cancelVIP`.
6. Run `npm run build` and create the MTA archive.
7. Review `git diff` and make sure this temporary file is excluded.
8. Deploy to the current BTP trial account, org `b7405b4etrial`, space `dev`.
9. Smoke-test in the deployed UI:
   - create player with required email and status;
   - choose 7/30/90 days from the VIP dialog;
   - activate twice and verify the expiry is extended;
   - grant VIP compensation and verify extension;
   - cancel VIP and verify the resulting status;
   - add low feedback and verify rating/status update without a manual reload.
10. Commit and push to `dev` only after all checks pass.

## Files currently modified

- `_i18n/i18n.properties`
- `_i18n/i18n_ru.properties`
- `app/players/annotations.cds`
- `db/schema.cds`
- `srv/domain/dates.ts`
- `srv/domain/presentation.ts`
- `srv/player-crm-service.cds`
- `srv/player-crm-service.ts`
- `srv/repositories/activity-repository.ts`
- `srv/services/compensation-service.ts`
- `srv/services/player-rating-service.ts`
- `srv/services/vip-service.ts`
- `test/business-logic.test.js`
