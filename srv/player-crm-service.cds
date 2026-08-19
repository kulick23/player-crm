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
  hideGrantCompensation @UI.Hidden;

  status @Common.ValueList: {
    CollectionPath : 'PlayerStatuses',
    Parameters     : [
      { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: status_ID, ValueListProperty: 'ID' },
      { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'code' },
      { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'description' }
    ]
  };
};

annotate PlayerCRMService.Players with actions {
  activateVIP @(Common.SideEffects: {
    TargetEntities: [_it, _it.loyalty, _it.interactions]
  });
  grantCompensation @(Common.SideEffects: {
    TargetEntities: [_it, _it.campaigns, _it.interactions, _it.loyalty]
  });
};

annotate PlayerCRMService.Players with actions {
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
