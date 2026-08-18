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

    case status.code
      when 'VIP'      then 3
      when 'Active'   then 3
      when 'AtRisk'   then 1
      when 'Inactive' then 2
      else                 0
    end as statusCriticality : Integer,

    case
      when averageRating is null then 0
      when averageRating >= 4    then 3
      when averageRating >= 3    then 2
      else                            1
    end as ratingCriticality : Integer
  } actions {
    @requires: 'CRMAdmin'
    action   activateVIP(tier: String) returns Players;

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
    case
      when rating >= 4 then 3
      when rating  = 3 then 2
      else                  1
    end as ratingCriticality : Integer
  };

  @restrict: [
    { grant: '*',    to: ['CRMAdmin', 'CommunityManager'] },
    { grant: 'READ', to: 'SupportAgent' }
  ]
  entity MarketingCampaigns as projection on playercrm.MarketingCampaign;

}

annotate PlayerCRMService.Players with {
  statusCode        @title: '{i18n>Players_statusCode}' @readonly;
  statusCriticality @UI.Hidden;
  ratingCriticality @UI.Hidden;

  status @Common.ValueList: {
    CollectionPath : 'PlayerStatuses',
    Parameters     : [
      { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: status_ID, ValueListProperty: 'ID' },
      { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'code' },
      { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'description' }
    ]
  };
};

annotate PlayerCRMService.Players with @(
  UI.LineItem: [
    { Value: displayName },
    { Value: email },
    { Value: statusCode,    Criticality: statusCriticality },
    { Value: balance },
    { Value: vipTier },
    { Value: averageRating, Criticality: ratingCriticality }
  ],
  UI.HeaderInfo: {
    TypeName      : '{i18n>Player_typeName}',
    TypeNamePlural: '{i18n>Player_typeNamePlural}',
    Title         : { Value: displayName },
    Description   : { Value: email }
  },
  UI.SelectionFields: [
    vipTier,
    status_ID
  ],
  UI.DataPoint #StatusPoint: {
    Value      : statusCode,
    Title      : '{i18n>Players_statusCode}',
    Criticality: statusCriticality
  },
  UI.DataPoint #RatingPoint: {
    Value        : averageRating,
    Title        : '{i18n>Player_averageRating}',
    Criticality  : ratingCriticality,
    TargetValue  : 5,
    Visualization: #Rating
  },
  UI.HeaderFacets: [
    { $Type: 'UI.ReferenceFacet', Target: '@UI.DataPoint#StatusPoint' },
    { $Type: 'UI.ReferenceFacet', Target: '@UI.DataPoint#RatingPoint' }
  ],
  UI.FieldGroup #Profile: {
    Data: [
      { Value: displayName },
      { Value: email },
      { Value: balance },
      { Value: vipTier },
      { Value: statusCode,    Criticality: statusCriticality },
      { Value: averageRating, Criticality: ratingCriticality }
    ]
  },
  UI.Facets: [
    {
      $Type : 'UI.ReferenceFacet',
      Label : '{i18n>Facet_profile}',
      Target: '@UI.FieldGroup#Profile'
    },
    {
      $Type : 'UI.ReferenceFacet',
      Label : '{i18n>Facet_interactions}',
      Target: 'interactions/@UI.LineItem'
    },
    {
      $Type : 'UI.ReferenceFacet',
      Label : '{i18n>Facet_feedback}',
      Target: 'feedbacks/@UI.LineItem'
    },
    {
      $Type : 'UI.ReferenceFacet',
      Label : '{i18n>Facet_loyalty}',
      Target: 'loyalty/@UI.LineItem'
    }
  ]
);

annotate PlayerCRMService.PlayerStatuses with @(
  UI.LineItem: [
    { Value: code },
    { Value: description }
  ]
);

annotate PlayerCRMService.Preferences with @(
  UI.LineItem: [
    { Value: favoriteMode },
    { Value: preferredRarity },
    { Value: notes }
  ]
);

annotate PlayerCRMService.Interactions with @(
  UI.LineItem: [
    { Value: type },
    { Value: date },
    { Value: summary }
  ]
);

annotate PlayerCRMService.LoyaltyPrograms with @(
  UI.LineItem: [
    { Value: tier },
    { Value: startDate },
    { Value: endDate },
    { Value: price }
  ]
);

annotate PlayerCRMService.Feedbacks with {
  ratingCriticality @UI.Hidden;
};

annotate PlayerCRMService.Feedbacks with @(
  UI.LineItem: [
    { Value: rating, Criticality: ratingCriticality },
    { Value: comment },
    { Value: feedbackDate }
  ]
);

annotate PlayerCRMService.MarketingCampaigns with @(
  UI.LineItem: [
    { Value: name },
    { Value: startDate },
    { Value: endDate },
    { Value: description }
  ],
  UI.SelectionFields: [
    name,
    startDate
  ],
  UI.HeaderInfo: {
    TypeName      : '{i18n>MarketingCampaign_typeName}',
    TypeNamePlural: '{i18n>MarketingCampaign_typeNamePlural}',
    Title         : { Value: name },
    Description   : { Value: description }
  },
  UI.FieldGroup #Details: {
    Data: [
      { Value: name },
      { Value: description },
      { Value: startDate },
      { Value: endDate }
    ]
  },
  UI.Facets: [
    {
      $Type : 'UI.ReferenceFacet',
      Label : '{i18n>Facet_details}',
      Target: '@UI.FieldGroup#Details'
    }
  ]
);
