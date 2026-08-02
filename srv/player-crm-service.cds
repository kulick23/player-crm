using playercrm from '../db/schema';

service PlayerCRMService {

  @odata.draft.enabled
  @UI.LineItem: [
    { Value: displayName },
    { Value: email },
    { Value: balance },
    { Value: vipTier }
  ]
  entity Players as projection on playercrm.Player actions {
    action activateVIP(tier: String) returns Players;
  };

  @UI.LineItem: [
    { Value: code },
    { Value: description }
  ]
  entity PlayerStatuses as projection on playercrm.PlayerStatus;

  @UI.LineItem: [
    { Value: favoriteMode },
    { Value: preferredRarity },
    { Value: notes }
  ]
  entity Preferences as projection on playercrm.Preference;

  @UI.LineItem: [
    { Value: type },
    { Value: date },
    { Value: summary }
  ]
  entity Interactions as projection on playercrm.Interaction;

  @UI.LineItem: [
    { Value: tier },
    { Value: startDate },
    { Value: endDate },
    { Value: price }
  ]
  entity LoyaltyPrograms as projection on playercrm.LoyaltyProgram;

  @UI.LineItem: [
    { Value: rating },
    { Value: comment },
    { Value: feedbackDate }
  ]
  entity Feedbacks as projection on playercrm.Feedback;

  @UI.LineItem: [
    { Value: name },
    { Value: startDate },
    { Value: endDate }
  ]
  entity MarketingCampaigns as projection on playercrm.MarketingCampaign;

}

annotate PlayerCRMService.Players with {
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
  UI.HeaderInfo: {
    TypeName      : 'Player',
    TypeNamePlural: 'Players',
    Title         : { Value: displayName }
  },
  UI.SelectionFields: [
    vipTier,
    status_ID
  ],
  UI.FieldGroup #Profile: {
    Data: [
      { Value: displayName },
      { Value: email },
      { Value: balance },
      { Value: vipTier }
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