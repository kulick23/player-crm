using PlayerCRMService from '../../srv/player-crm-service';

annotate PlayerCRMService.OrderIssues with {
  statusCriticality @UI.Hidden;

  category @(
    Common.ValueListWithFixedValues: true,
    Common.ValueList: {
      CollectionPath: 'OrderIssueCategories',
      Parameters: [
        { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: category_code, ValueListProperty: 'code' },
        { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' }
      ]
    }
  );

  status @(
    Common.ValueListWithFixedValues: true,
    Common.ValueList: {
      CollectionPath: 'OrderIssueStatuses',
      Parameters: [
        { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: status_code, ValueListProperty: 'code' },
        { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' }
      ]
    }
  );
};

annotate PlayerCRMService.OrderIssues with actions {
  resolveIssue(
    resolutionNote @title: '{i18n>Action_resolveIssue_note}',
    campaign_ID @(
      title: '{i18n>Action_resolveIssue_campaign}',
      Common.ValueList: {
        CollectionPath: 'MarketingCampaigns',
        SearchSupported: true,
        Parameters: [
          { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: campaign_ID, ValueListProperty: 'ID' },
          { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' },
          { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'compensationType' },
          { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'compensationValue' }
        ]
      }
    )
  );
};

annotate PlayerCRMService.OrderIssues with @(
  UI.LineItem: [
    { Value: playerName },
    { Value: orderID },
    { Value: categoryName },
    { Value: rating },
    { Value: statusName, Criticality: statusCriticality },
    { Value: createdAt },
    {
      $Type: 'UI.DataFieldForAction',
      Action: 'PlayerCRMService.resolveIssue',
      Label: '{i18n>Action_resolveIssue}'
    }
  ],
  UI.SelectionFields: [playerName, statusCode, category_code, rating],
  UI.HeaderInfo: {
    TypeName: '{i18n>OrderIssue_typeName}',
    TypeNamePlural: '{i18n>OrderIssue_typeNamePlural}',
    Title: { Value: playerName },
    Description: { Value: orderID }
  },
  UI.Identification: [
    {
      $Type: 'UI.DataFieldForAction',
      Action: 'PlayerCRMService.resolveIssue',
      Label: '{i18n>Action_resolveIssue}'
    }
  ],
  UI.FieldGroup #Problem: {
    Data: [
      { Value: playerName },
      { Value: orderID },
      { Value: orderDate },
      { Value: orderTotal },
      { Value: categoryName },
      { Value: rating },
      { Value: description },
      { Value: statusName, Criticality: statusCriticality },
      { Value: createdAt }
    ]
  },
  UI.FieldGroup #Resolution: {
    Data: [
      { Value: resolutionNote },
      { Value: compensationCampaign.name },
      { Value: resolvedAt },
      { Value: resolvedBy }
    ]
  },
  UI.Facets: [
    { $Type: 'UI.ReferenceFacet', Label: '{i18n>Facet_problem}', Target: '@UI.FieldGroup#Problem' },
    { $Type: 'UI.ReferenceFacet', Label: '{i18n>Facet_resolution}', Target: '@UI.FieldGroup#Resolution' }
  ]
);

annotate PlayerCRMService.OrderIssueCategories with @UI.LineItem: [
  { Value: code },
  { Value: name }
];

annotate PlayerCRMService.OrderIssueStatuses with @UI.LineItem: [
  { Value: code },
  { Value: name }
];
