using playercrm from '../db/schema';

@path: '/integration/players'
@requires: 'system-user'
service PlayerIntegrationService {
  type OrderIssueReceipt {
    ID         : UUID;
    statusCode : String(20);
  }

  @readonly
  entity Players as projection on playercrm.Player {
    key ID,
        displayName,
        email,
        vipTier,
        averageRating,
        status.code as statusCode : String(20)
  };

  action reportOrderIssue(
    orderID      : UUID,
    playerID     : UUID,
    categoryCode : String(30),
    rating       : Integer,
    description  : String(1000),
    orderDate    : DateTime,
    orderTotal   : Decimal(10,2)
  ) returns OrderIssueReceipt;
}
