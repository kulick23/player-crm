namespace playercrm;

using { cuid, managed } from '@sap/cds/common';

entity Player : cuid, managed {
  displayName   : String(100) @mandatory;
  email         : String(100);
  balance       : Decimal(10,2) default 0;
  vipTier       : String(20);
  status        : Association to PlayerStatus;
  preference    : Association to Preference;
  interactions  : Composition of many Interaction on interactions.player = $self;
  loyalty       : Composition of many LoyaltyProgram on loyalty.player = $self;
  feedbacks     : Composition of many Feedback on feedbacks.player = $self;
  averageRating : Decimal(2,1) @readonly;
}

entity PlayerStatus : cuid {
  code        : String(20) @mandatory;
  description : String(100);
}

entity Preference : cuid {
  favoriteMode     : String(50);
  preferredRarity  : String(20);
  notes            : String(200);
}

entity Interaction : cuid, managed {
  player   : Association to Player;
  type     : String(30);
  date     : DateTime;
  summary  : String(200);
}

entity LoyaltyProgram : cuid, managed {
  player     : Association to Player;
  tier       : String(20);
  startDate  : Date;
  endDate    : Date;
  price      : Decimal(10,2);
  perks      : String(200);
}

entity Feedback : cuid, managed {
  player       : Association to Player;
  rating       : Integer @assert.range: [1,5];
  comment      : String(300);
  feedbackDate : DateTime;
}

entity MarketingCampaign : cuid, managed {
  name        : String(100);
  startDate   : Date;
  endDate     : Date;
  description : String(200);
  players     : Association to many PlayerCampaigns on players.campaign = $self;
}

entity PlayerCampaigns : cuid {
  player   : Association to Player;
  campaign : Association to MarketingCampaign;
}