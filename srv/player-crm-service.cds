using playercrm from '../db/schema';

@requires: 'authenticated-user'
service PlayerCRMService {

  @odata.draft.enabled
  @restrict: [
    { grant: '*',                    to: 'CRMAdmin' },
    { grant: ['READ', 'UPDATE'],     to: 'SupportAgent' },
    { grant: 'READ',                 to: 'CommunityManager' }
  ]
  entity Players as projection on playercrm.Player {
    *,
    status.code as statusCode : String(20),

    status.criticality as statusCriticality : Integer,
    virtual null as ratingCriticality : Integer,
    virtual null as hideActivateVIP : Boolean,
    virtual null as hideGrantCompensation : Boolean
  } actions {
    @requires: 'CRMAdmin'
    action   activateVIP(tier: String) returns Players;

    @restrict: [{ grant: '*', to: ['CRMAdmin', 'SupportAgent'] }]
    action   grantCompensation(campaign_ID: UUID, note: String) returns Players;

    function stats() returns PlayerStats;
  };

  function atRiskPlayers(minRating: Decimal(2,1)) returns array of PlayerSummary;

  type PlayerStats {
    feedbackCount    : Integer;
    interactionCount : Integer;
    loyaltyTotal     : Decimal(10,2);
    averageRating    : Decimal(2,1);
    activeSince      : DateTime;
  }

  type PlayerSummary {
    ID            : UUID;
    displayName   : String(100);
    statusCode    : String(20);
    averageRating : Decimal(2,1);
  }

  @restrict: [
    { grant: '*',    to: 'CRMAdmin' },
    { grant: 'READ', to: ['SupportAgent', 'CommunityManager'] }
  ]
  entity PlayerStatuses as projection on playercrm.PlayerStatus;

  @restrict: [
    { grant: '*',                to: 'CRMAdmin' },
    { grant: ['READ', 'UPDATE'], to: 'SupportAgent' },
    { grant: 'READ',             to: 'CommunityManager' }
  ]
  entity Preferences as projection on playercrm.Preference;

  @restrict: [
    { grant: '*',                          to: 'CRMAdmin' },
    { grant: ['READ', 'CREATE', 'UPDATE'], to: 'SupportAgent' },
    { grant: 'READ',                       to: 'CommunityManager' }
  ]
  entity Interactions as projection on playercrm.Interaction;

  @restrict: [
    { grant: '*',    to: 'CRMAdmin' },
    { grant: 'READ', to: ['SupportAgent', 'CommunityManager'] }
  ]
  entity LoyaltyPrograms as projection on playercrm.LoyaltyProgram;

  @restrict: [
    { grant: '*',                to: 'CRMAdmin' },
    { grant: ['READ', 'CREATE'], to: 'SupportAgent' },
    { grant: 'READ',             to: 'CommunityManager' }
  ]
  entity Feedbacks as projection on playercrm.Feedback {
    *,
    virtual null as ratingCriticality : Integer
  };

  @odata.draft.enabled
  @restrict: [
    { grant: '*',    to: ['CRMAdmin', 'CommunityManager'] },
    { grant: 'READ', to: 'SupportAgent' }
  ]
  entity MarketingCampaigns as projection on playercrm.MarketingCampaign;

  @restrict: [
    { grant: '*',    to: ['CRMAdmin', 'CommunityManager'] },
    { grant: 'READ', to: 'SupportAgent' }
  ]
  entity CampaignParticipants as projection on playercrm.PlayerCampaigns;

  @readonly
  entity CompensationTypes as projection on playercrm.CompensationType;

  @readonly
  entity CampaignReasons as projection on playercrm.CampaignReason;

}
