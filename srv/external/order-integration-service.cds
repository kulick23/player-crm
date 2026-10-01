@cds.external
@path: '/integration/orders'
service OrderIntegrationService {
  function getPlayerOrderSummary(playerID: String(36)) returns OrderSummary;

  type OrderSummary {
    orderCount     : Integer;
    totalSpent     : Decimal(10,2);
    paidOrderCount : Integer;
    lastOrderDate  : DateTime;
  }
}
