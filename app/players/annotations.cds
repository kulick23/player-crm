using PlayerCRMService from '../../srv/player-crm-service';

annotate PlayerCRMService.Players with {
  statusCode        @title: '{i18n>Players_statusCode}' @readonly @Common.ValueList: {
    CollectionPath : 'PlayerStatuses',
    Parameters     : [
      { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: statusCode, ValueListProperty: 'code' },
      { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'description' }
    ]
  };
  statusCriticality     @UI.Hidden;
  ratingCriticality     @UI.Hidden;
  hideActivateVIP       @UI.Hidden;
  hideCancelVIP         @UI.Hidden;
  hideGrantCompensation @UI.Hidden;

  status @(
    Common.ValueListWithFixedValues: true,
    Common.ValueList: {
      CollectionPath : 'PlayerStatuses',
      Parameters     : [
        { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: status_ID, ValueListProperty: 'ID' },
        { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'code' },
        { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'description' }
      ]
    }
  );
};

annotate PlayerCRMService.Players with actions {
  activateVIP @(Common.SideEffects: {
    TargetEntities  : [_it, _it.loyalty, _it.interactions],
    TargetProperties: [_it.vipTier, _it.statusCode, _it.status_ID]
  });
  cancelVIP @(Common.SideEffects: {
    TargetEntities  : [_it, _it.loyalty, _it.interactions],
    TargetProperties: [_it.vipTier, _it.statusCode, _it.status_ID]
  });
  grantCompensation @(Common.SideEffects: {
    TargetEntities  : [_it, _it.campaigns, _it.interactions, _it.loyalty],
    TargetProperties: [_it.balance, _it.vipTier, _it.statusCode, _it.status_ID]
  });
};

annotate PlayerCRMService.Players with actions {
  activateVIP(tier @(
    title: '{i18n>Action_activateVIP_duration}',
    Common.ValueListWithFixedValues: true,
    Common.ValueList: {
      CollectionPath : 'VIPDurations',
      Parameters     : [
        { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: tier, ValueListProperty: 'code' },
        { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'label' },
        { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'price' }
      ]
    }
  ));
  grantCompensation(campaign_ID @(
    title: '{i18n>Action_grantCompensation_campaign}',
    Common.ValueList: {
      CollectionPath : 'MarketingCampaigns',
      SearchSupported: true,
      Parameters     : [
        { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: campaign_ID, ValueListProperty: 'ID' },
        { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' },
        { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'reason' },
        { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'compensationType' },
        { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'compensationValue' }
      ]
    }
  ), note @title: '{i18n>Action_grantCompensation_note}');
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
    displayName,
    statusCode,
    vipTier,
    averageRating,
    balance
  ],
  UI.Identification: [
    {
      $Type : 'UI.DataFieldForAction',
      Action: 'PlayerCRMService.grantCompensation',
      Label : '{i18n>Action_grantCompensation}',
      ![@UI.Hidden]: hideGrantCompensation
    },
    {
      $Type : 'UI.DataFieldForAction',
      Action: 'PlayerCRMService.activateVIP',
      Label : '{i18n>Action_activateVIP}',
      ![@UI.Hidden]: hideActivateVIP
    },
    {
      $Type : 'UI.DataFieldForAction',
      Action: 'PlayerCRMService.cancelVIP',
      Label : '{i18n>Action_cancelVIP}',
      ![@UI.Hidden]: hideCancelVIP
    }
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
      { Value: status_ID },
      { Value: statusCode,    Criticality: statusCriticality, ![@UI.Hidden]: IsActiveEntity },
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
      $Type : 'UI.CollectionFacet',
      Label : '{i18n>Facet_activity}',
      ID    : 'ActivityFacet',
      Facets: [
        {
          $Type : 'UI.ReferenceFacet',
          Label : '{i18n>Facet_interactions}',
          Target: 'interactions/@UI.LineItem'
        },
        {
          $Type : 'UI.ReferenceFacet',
          Label : '{i18n>Facet_loyalty}',
          Target: 'loyalty/@UI.LineItem'
        }
      ]
    },
    {
      $Type : 'UI.ReferenceFacet',
      Label : '{i18n>Facet_feedback}',
      Target: 'feedbacks/@UI.LineItem'
    },
    {
      $Type : 'UI.ReferenceFacet',
      Label : '{i18n>Facet_orderIssues}',
      Target: 'orderIssues/@UI.LineItem'
    },
    {
      $Type : 'UI.ReferenceFacet',
      Label : '{i18n>Facet_campaigns}',
      Target: 'campaigns/@UI.LineItem'
    }
  ],

  UI.SelectionVariant #AtRisk: {
    Text         : '{i18n>View_atRisk}',
    SelectOptions: [
      {
        $Type       : 'UI.SelectOptionType',
        PropertyName: statusCode,
        Ranges      : [
          { $Type: 'UI.SelectionRangeType', Sign: #I, Option: #EQ, Low: 'AtRisk' }
        ]
      }
    ]
  },

  UI.SelectionVariant #Vip: {
    Text         : '{i18n>View_vip}',
    SelectOptions: [
      {
        $Type       : 'UI.SelectOptionType',
        PropertyName: statusCode,
        Ranges      : [
          { $Type: 'UI.SelectionRangeType', Sign: #I, Option: #EQ, Low: 'VIP' }
        ]
      }
    ]
  },

  UI.PresentationVariant #Default: {
    Visualizations: ['@UI.LineItem'],
    SortOrder     : [
      { $Type: 'Common.SortOrderType', Property: displayName, Descending: false }
    ]
  },

  UI.SelectionPresentationVariant #AllPlayers: {
    Text               : '{i18n>View_all}',
    PresentationVariant: ![@UI.PresentationVariant#Default],
    SelectionVariant   : { $Type: 'UI.SelectionVariantType', SelectOptions: [] }
  },

  UI.SelectionPresentationVariant #AtRiskPlayers: {
    Text               : '{i18n>View_atRisk}',
    PresentationVariant: ![@UI.PresentationVariant#Default],
    SelectionVariant   : ![@UI.SelectionVariant#AtRisk]
  },

  UI.SelectionPresentationVariant #VipPlayers: {
    Text               : '{i18n>View_vip}',
    PresentationVariant: ![@UI.PresentationVariant#Default],
    SelectionVariant   : ![@UI.SelectionVariant#Vip]
  }
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
