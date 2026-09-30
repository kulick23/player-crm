import cds, { Request, Service } from '@sap/cds';
import type { Feedback } from '#cds-models/PlayerCRMService';

import { applyRatingCriticality } from '../domain/presentation';
import { syncPlayerRating } from '../services/player-rating-service';

export const registerFeedbackHandlers = (srv: Service): void => {
  srv.after('READ', 'Feedbacks', (feedbacks: unknown) => {
    applyRatingCriticality(feedbacks, 'rating');
  });

  srv.after('CREATE', 'Feedbacks', async (result: unknown, req: Request) => {
    const feedback = result as Feedback;
    await syncPlayerRating(cds.tx(req), feedback.player_ID);
  });
};
