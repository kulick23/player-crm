using playercrm from '../db/schema';

service PlayerCRMService {

  @odata.draft.enabled
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
    action activateVIP(tier: String) returns Players;
  };

  entity PlayerStatuses as projection on playercrm.PlayerStatus;

  entity Preferences as projection on playercrm.Preference;

  entity Interactions as projection on playercrm.Interaction;

  entity LoyaltyPrograms as projection on playercrm.LoyaltyProgram;

  entity Feedbacks as projection on playercrm.Feedback {
    *,
    case
      when rating >= 4 then 3
      when rating  = 3 then 2
      else                  1
    end as ratingCriticality : Integer
  };

  entity MarketingCampaigns as projection on playercrm.MarketingCampaign;

}

annotate PlayerCRMService.Players with {
  statusCode        @title: 'Status'         @readonly;
  statusCriticality @UI.Hidden;
  ratingCriticality @UI.Hidden;
  averageRating     @title: 'Average Rating';

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
    TypeName      : 'Player',
    TypeNamePlural: 'Players',
    Title         : { Value: displayName },
    Description   : { Value: email }
  },
  UI.SelectionFields: [
    vipTier,
    status_ID
  ],
  UI.DataPoint #StatusPoint: {
    Value      : statusCode,
    Title      : 'Status',
    Criticality: statusCriticality
  },
  UI.DataPoint #RatingPoint: {
    Value        : averageRating,
    Title        : 'Average Rating',
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
      Label : 'Profile',
      Target: '@UI.FieldGroup#Profile'
    },
    {
      $Type : 'UI.ReferenceFacet',
      Label : 'Interactions',
      Target: 'interactions/@UI.LineItem'
    },
    {
      $Type : 'UI.ReferenceFacet',
      Label : 'Feedback',
      Target: 'feedbacks/@UI.LineItem'
    },
    {
      $Type : 'UI.ReferenceFacet',
      Label : 'Loyalty',
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
    { Value: endDate }
  ]
);
