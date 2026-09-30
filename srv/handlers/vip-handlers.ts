import cds, { Request, Service } from '@sap/cds';

import { isTier, VIP_TIERS } from '../domain/player';
import { activateVIP } from '../services/vip-service';
import { boundPlayerID, readPlayer } from './request';

export const registerVIPHandlers = (srv: Service): void => {
  srv.before('activateVIP', 'Players', (req: Request) => {
    if (!isTier(req.data.tier)) {
      return req.reject(
        400,
        `Unknown VIP tier "${req.data.tier}". Expected one of: ${Object.keys(VIP_TIERS).join(', ')}`
      );
    }
  });

  srv.on('activateVIP', 'Players', async (req: Request) => {
    const playerID = boundPlayerID(req);
    const tier = req.data.tier;
    if (!isTier(tier)) return req.reject(400, 'A valid VIP tier is required');

    const tx = cds.tx(req);
    await activateVIP(tx, playerID, tier);
    return readPlayer(srv, tx, playerID);
  });
};
