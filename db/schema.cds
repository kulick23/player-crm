namespace playercrm;

using { cuid, managed } from '@sap/cds/common';

@title: '{i18n>Player}'
entity Player : cuid, managed {
  displayName   : String(100) @title: '{i18n>Player_displayName}' @mandatory;
  email         : String(100) @title: '{i18n>Player_email}';
  balance       : Decimal(10,2) default 0 @title: '{i18n>Player_balance}';
  vipTier       : String(20) @title: '{i18n>Player_vipTier}';
  status        : Association to PlayerStatus @title: '{i18n>Player_status}';
  preference    : Association to Preference @title: '{i18n>Player_preference}';
  interactions  : Composition of many Interaction on interactions.player = $self;
  loyalty       : Composition of many LoyaltyProgram on loyalty.player = $self;
  feedbacks     : Composition of many Feedback on feedbacks.player = $self;
  campaigns     : Composition of many PlayerCampaigns on campaigns.player = $self;
  averageRating : Decimal(2,1) @title: '{i18n>Player_averageRating}' @readonly;
}

@title: '{i18n>PlayerStatus}'
entity PlayerStatus : cuid {
  code        : String(20) @title: '{i18n>PlayerStatus_code}' @mandatory;
  description : String(100) @title: '{i18n>PlayerStatus_description}';
  criticality : Integer @title: '{i18n>PlayerStatus_criticality}';
}

@title: '{i18n>Preference}'
entity Preference : cuid {
  favoriteMode     : String(50) @title: '{i18n>Preference_favoriteMode}';
  preferredRarity  : String(20) @title: '{i18n>Preference_preferredRarity}';
  notes            : String(200) @title: '{i18n>Preference_notes}';
}

@title: '{i18n>Interaction}'
entity Interaction : cuid, managed {
  player   : Association to Player @title: '{i18n>Interaction_player}';
  type     : String(30) @title: '{i18n>Interaction_type}';
  date     : DateTime @title: '{i18n>Interaction_date}';
  summary  : String(200) @title: '{i18n>Interaction_summary}';
}

@title: '{i18n>LoyaltyProgram}'
entity LoyaltyProgram : cuid, managed {
  player     : Association to Player @title: '{i18n>LoyaltyProgram_player}';
  tier       : String(20) @title: '{i18n>LoyaltyProgram_tier}';
  startDate  : Date @title: '{i18n>LoyaltyProgram_startDate}';
  endDate    : Date @title: '{i18n>LoyaltyProgram_endDate}';
  price      : Decimal(10,2) @title: '{i18n>LoyaltyProgram_price}';
  perks      : String(200) @title: '{i18n>LoyaltyProgram_perks}';
}

@title: '{i18n>Feedback}'
entity Feedback : cuid, managed {
  player       : Association to Player @title: '{i18n>Feedback_player}';
  rating       : Integer @title: '{i18n>Feedback_rating}' @assert.range: [1,5];
  comment      : String(300) @title: '{i18n>Feedback_comment}';
  feedbackDate : DateTime @title: '{i18n>Feedback_feedbackDate}';
}

@title: '{i18n>MarketingCampaign}'
entity MarketingCampaign : cuid, managed {
  name        : String(100) @title: '{i18n>MarketingCampaign_name}';
  startDate   : Date @title: '{i18n>MarketingCampaign_startDate}';
  endDate     : Date @title: '{i18n>MarketingCampaign_endDate}';
  description : String(200) @title: '{i18n>MarketingCampaign_description}';
  players     : Association to many PlayerCampaigns on players.campaign = $self;
}

@title: '{i18n>PlayerCampaigns}'
entity PlayerCampaigns : cuid {
  player   : Association to Player @title: '{i18n>PlayerCampaigns_player}';
  campaign : Association to MarketingCampaign @title: '{i18n>PlayerCampaigns_campaign}';
}
