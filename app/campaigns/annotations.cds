using PlayerCRMService from '../../srv/player-crm-service';

annotate PlayerCRMService.MarketingCampaigns with {
  compensationType @Common.ValueList: {
    CollectionPath              : 'CompensationTypes',
    Label                       : '{i18n>MarketingCampaign_compensationType}',
    Parameters                  : [
      { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: compensationType, ValueListProperty: 'code' },
      { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' },
      { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'description' }
    ]
  } @Common.ValueListWithFixedValues;

  reason @Common.ValueList: {
    CollectionPath              : 'CampaignReasons',
    Label                       : '{i18n>MarketingCampaign_reason}',
    Parameters                  : [
      { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: reason, ValueListProperty: 'code' },
      { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' },
      { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'description' }
    ]
  } @Common.ValueListWithFixedValues;
};

annotate PlayerCRMService.MarketingCampaigns with @(
  UI.LineItem: [
    { Value: name },
    { Value: reason },
    { Value: compensationType },
    { Value: compensationValue },
    { Value: startDate },
    { Value: endDate }
  ],
  UI.SelectionFields: [
    name,
    reason,
    compensationType
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
      { Value: reason },
      { Value: compensationType },
      { Value: compensationValue },
      { Value: startDate },
      { Value: endDate }
    ]
  },
  UI.Facets: [
    {
      $Type : 'UI.ReferenceFacet',
      Label : '{i18n>Facet_details}',
      Target: '@UI.FieldGroup#Details'
    },
    {
      $Type : 'UI.ReferenceFacet',
      Label : '{i18n>Facet_participants}',
      Target: 'participants/@UI.LineItem'
    }
  ]
);

annotate PlayerCRMService.CampaignParticipants with {
  player @Common.ValueList: {
    CollectionPath : 'Players',
    SearchSupported: true,
    Parameters     : [
      { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: player_ID, ValueListProperty: 'ID' },
      { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'displayName' },
      { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'statusCode' }
    ]
  };

  campaign @Common.ValueList: {
    CollectionPath : 'MarketingCampaigns',
    SearchSupported: true,
    Parameters     : [
      { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: campaign_ID, ValueListProperty: 'ID' },
      { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' },
      { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'startDate' }
    ]
  };
};

annotate PlayerCRMService.CampaignParticipants with @(
  UI.LineItem: [
    { Value: player.displayName },
    { Value: campaign.name },
    { Value: campaign.compensationType },
    { Value: campaign.compensationValue },
    { Value: createdAt },
    { Value: note }
  ]
);
