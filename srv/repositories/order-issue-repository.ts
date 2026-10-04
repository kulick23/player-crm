import cds, { Transaction } from '@sap/cds';

import { ENTITIES } from './entities';

const { INSERT, SELECT, UPDATE } = cds.ql;

export interface OrderIssueRecord {
  ID: string;
  player_ID: string;
  orderID: string;
  status_code: string;
}

export const findIssueStatus = async (tx: Transaction, code: string) =>
  tx.run(SELECT.one.from(ENTITIES.orderIssueStatus).where({ code }));

export const findIssueCategory = async (tx: Transaction, code: string) =>
  tx.run(SELECT.one.from(ENTITIES.orderIssueCategory).where({ code }));

export const findOrderIssue = async (
  tx: Transaction,
  issueID: string
): Promise<OrderIssueRecord | undefined> =>
  tx.run(SELECT.one.from(ENTITIES.orderIssue).where({ ID: issueID })) as Promise<
    OrderIssueRecord | undefined
  >;

export const findUnresolvedOrderIssue = async (
  tx: Transaction,
  playerID: string,
  orderID: string,
  resolvedStatusCode: string
): Promise<OrderIssueRecord | undefined> =>
  tx.run(
    SELECT.one
      .from(ENTITIES.orderIssue)
      .where({ player_ID: playerID, orderID })
      .and`status_code <> ${resolvedStatusCode}`
  ) as Promise<OrderIssueRecord | undefined>;

export const createOrderIssue = async (
  tx: Transaction,
  data: Record<string, unknown>
): Promise<string> => {
  const ID = cds.utils.uuid();
  await tx.run(INSERT.into(ENTITIES.orderIssue).entries({ ID, ...data }));
  return ID;
};

export const updateOrderIssue = async (
  tx: Transaction,
  issueID: string,
  changes: Record<string, unknown>
): Promise<void> => {
  await tx.run(UPDATE.entity(ENTITIES.orderIssue, issueID).with(changes));
};
