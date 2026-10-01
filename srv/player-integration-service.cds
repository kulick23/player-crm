using playercrm from '../db/schema';

@path: '/integration/players'
@requires: 'system-user'
service PlayerIntegrationService {
  @readonly
  entity Players as projection on playercrm.Player {
    key ID,
        displayName,
        email,
        vipTier,
        averageRating,
        status.code as statusCode : String(20)
  };
}
