import cds, { Request, Service } from '@sap/cds';
import type { Player } from '#cds-models/PlayerCRMService';

import { applyActionVisibility, applyRatingCriticality } from '../domain/presentation';
import { AT_RISK_THRESHOLD } from '../domain/player';
import { getPlayerStats } from '../services/player-query-service';
import { syncPlayerRating } from '../services/player-rating-service';
import { boundPlayerID } from './request';

const { SELECT } = cds.ql;

export const registerPlayerHandlers = (srv: Service): void => {
  srv.after('READ', 'Players', (players: unknown, req: Request) => {
    applyRatingCriticality(players, 'averageRating');
    applyActionVisibility(players, req.user);
  });

  srv.after('SAVE', 'Players', async (result: unknown, req: Request) => {
    const player = result as Player;
    const changes = await syncPlayerRating(cds.tx(req), player?.ID);
    if (changes) Object.assign(player, changes);
  });

  srv.on('stats', 'Players', async (req: Request) => {
    const playerID = boundPlayerID(req);
    const stats = await getPlayerStats(cds.tx(req), playerID);
    if (!stats) return req.reject(404, `Player ${playerID} not found`);
    return stats;
  });

  srv.on('atRiskPlayers', async (req: Request) => {
    const threshold = Number(req.data.minRating ?? AT_RISK_THRESHOLD);
    return cds.tx(req).run(
      SELECT.from(srv.entities.Players)
        .columns('ID', 'displayName', 'statusCode', 'averageRating')
        .where`averageRating < ${threshold} or statusCode = 'AtRisk'`
        .orderBy('averageRating asc')
    );
  });
};
