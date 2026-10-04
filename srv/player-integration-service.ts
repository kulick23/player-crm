import cds, { Request, Service } from '@sap/cds';

import { isOrderIssueCategory, ORDER_ISSUE_STATUSES } from './domain/order-issues';
import { createFeedback } from './repositories/activity-repository';
import {
  createOrderIssue,
  findIssueCategory,
  findIssueStatus,
  findUnresolvedOrderIssue
} from './repositories/order-issue-repository';
import { findPlayer } from './repositories/player-repository';
import { logInteraction } from './services/interaction-service';
import { syncPlayerRating } from './services/player-rating-service';

export = (srv: Service) => {
  srv.on('reportOrderIssue', async (req: Request) => {
    const orderID = String(req.data.orderID ?? '');
    const playerID = String(req.data.playerID ?? '');
    const categoryCode = String(req.data.categoryCode ?? '');
    const description = String(req.data.description ?? '').trim();
    const rating = Number(req.data.rating);

    if (!orderID || !playerID) return req.reject(400, 'Order and player are required');
    if (!isOrderIssueCategory(categoryCode)) {
      return req.reject(400, `Unknown order issue category "${categoryCode}"`);
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return req.reject(400, 'Rating must be an integer from 1 to 5');
    }
    if (!description) return req.reject(400, 'Problem description is required');

    const tx = cds.tx(req);
    const [player, category, openStatus, resolvedStatus] = await Promise.all([
      findPlayer(tx, playerID),
      findIssueCategory(tx, categoryCode),
      findIssueStatus(tx, ORDER_ISSUE_STATUSES.open),
      findIssueStatus(tx, ORDER_ISSUE_STATUSES.resolved)
    ]);

    if (!player) return req.reject(404, `Player ${playerID} not found`);
    if (!category || !openStatus || !resolvedStatus) {
      return req.reject(500, 'Order issue reference data is not configured');
    }

    const duplicate = await findUnresolvedOrderIssue(
      tx,
      playerID,
      orderID,
      resolvedStatus.code
    );
    if (duplicate) {
      return req.reject(409, 'An unresolved issue already exists for this order');
    }

    const ID = await createOrderIssue(tx, {
      player_ID: playerID,
      orderID,
      orderDate: req.data.orderDate || null,
      orderTotal: req.data.orderTotal ?? null,
      category_code: categoryCode,
      rating,
      description,
      status_code: ORDER_ISSUE_STATUSES.open
    });

    await createFeedback(tx, {
      player_ID: playerID,
      rating,
      comment: `Order ${orderID}: ${description}`.slice(0, 300),
      feedbackDate: new Date().toISOString()
    });
    await syncPlayerRating(tx, playerID);
    await logInteraction(
      tx,
      playerID,
      'OrderIssueReported',
      `Issue ${ID} reported for order ${orderID}`
    );

    return { ID, statusCode: ORDER_ISSUE_STATUSES.open };
  });
};
