import cds from '@sap/cds';

export interface OrderSummary {
  orderCount: number;
  totalSpent: number;
  paidOrderCount: number;
  lastOrderDate: string | null;
}

export const getOrderSummary = async (playerID: string): Promise<OrderSummary> => {
  const orders = await cds.connect.to('OrderIntegrationService');
  return orders.send('getPlayerOrderSummary', { playerID }) as Promise<OrderSummary>;
};
