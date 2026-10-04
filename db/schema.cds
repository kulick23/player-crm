namespace playercrm;

using { cuid, managed } from '@sap/cds/common';

@title: '{i18n>Player}'
entity Player : cuid, managed {
  displayName   : String(100) @title: '{i18n>Player_displayName}' @mandatory;
  email         : String(100) @title: '{i18n>Player_email}' @mandatory;
  balance       : Decimal(10,2) default 0 @title: '{i18n>Player_balance}';
  vipTier       : String(20) @title: '{i18n>Player_vipTier}';
  status        : Association to PlayerStatus @title: '{i18n>Player_status}' @mandatory;
  preference    : Association to Preference @title: '{i18n>Player_preference}';
  interactions  : Composition of many Interaction on interactions.player = $self;
  loyalty       : Composition of many LoyaltyProgram on loyalty.player = $self;
  feedbacks     : Composition of many Feedback on feedbacks.player = $self;
  orderIssues   : Composition of many OrderIssue on orderIssues.player = $self;
  campaigns     : Association to many PlayerCampaigns on campaigns.player = $self;
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
  name              : String(100) @title: '{i18n>MarketingCampaign_name}' @mandatory;
  description       : String(200) @title: '{i18n>MarketingCampaign_description}';
  startDate         : Date @title: '{i18n>MarketingCampaign_startDate}';
  endDate           : Date @title: '{i18n>MarketingCampaign_endDate}';
  reason            : String(30) @title: '{i18n>MarketingCampaign_reason}';
  compensationType  : String(20) @title: '{i18n>MarketingCampaign_compensationType}';
  compensationValue : Decimal(10,2) @title: '{i18n>MarketingCampaign_compensationValue}';
  participants      : Composition of many PlayerCampaigns on participants.campaign = $self;
}

@title: '{i18n>CompensationType}'
entity CompensationType {
  key code    : String(20) @title: '{i18n>CompensationType_code}';
  name        : String(50) @title: '{i18n>CompensationType_name}';
  description : String(100) @title: '{i18n>CompensationType_description}';
}

@title: '{i18n>CampaignReason}'
entity CampaignReason {
  key code    : String(30) @title: '{i18n>CampaignReason_code}';
  name        : String(50) @title: '{i18n>CampaignReason_name}';
  description : String(100) @title: '{i18n>CampaignReason_description}';
}

@title: '{i18n>PlayerCampaigns}'
entity PlayerCampaigns : cuid, managed {
  player   : Association to Player @title: '{i18n>PlayerCampaigns_player}';
  campaign : Association to MarketingCampaign @title: '{i18n>PlayerCampaigns_campaign}';
  note     : String(200) @title: '{i18n>PlayerCampaigns_note}';
}

@title: '{i18n>OrderIssueCategory}'
entity OrderIssueCategory {
  key code    : String(30) @title: '{i18n>OrderIssueCategory_code}';
      name    : localized String(100) @title: '{i18n>OrderIssueCategory_name}';
}

@title: '{i18n>OrderIssueStatus}'
entity OrderIssueStatus {
  key code        : String(20) @title: '{i18n>OrderIssueStatus_code}';
      name        : localized String(100) @title: '{i18n>OrderIssueStatus_name}';
      criticality : Integer @title: '{i18n>OrderIssueStatus_criticality}';
}

@title: '{i18n>OrderIssue}'
entity OrderIssue : cuid, managed {
  player               : Association to Player @title: '{i18n>OrderIssue_player}' @mandatory;
  orderID              : UUID @title: '{i18n>OrderIssue_orderID}' @mandatory;
  orderDate            : DateTime @title: '{i18n>OrderIssue_orderDate}';
  orderTotal           : Decimal(10,2) @title: '{i18n>OrderIssue_orderTotal}';
  category             : Association to OrderIssueCategory @title: '{i18n>OrderIssue_category}' @mandatory;
  rating               : Integer @title: '{i18n>OrderIssue_rating}' @assert.range: [1,5];
  description          : String(1000) @title: '{i18n>OrderIssue_description}' @mandatory;
  status               : Association to OrderIssueStatus @title: '{i18n>OrderIssue_status}' @mandatory;
  resolutionNote       : String(1000) @title: '{i18n>OrderIssue_resolutionNote}';
  compensationCampaign : Association to MarketingCampaign @title: '{i18n>OrderIssue_compensationCampaign}';
  resolvedAt           : DateTime @title: '{i18n>OrderIssue_resolvedAt}';
  resolvedBy           : String(255) @title: '{i18n>OrderIssue_resolvedBy}';
}
