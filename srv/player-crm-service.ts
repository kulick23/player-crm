import { Service } from '@sap/cds';

import { registerCompensationHandlers } from './handlers/compensation-handlers';
import { registerFeedbackHandlers } from './handlers/feedback-handlers';
import { registerPlayerHandlers } from './handlers/player-handlers';
import { registerVIPHandlers } from './handlers/vip-handlers';

export = (srv: Service) => {
  registerPlayerHandlers(srv);
  registerFeedbackHandlers(srv);
  registerVIPHandlers(srv);
  registerCompensationHandlers(srv);
};
