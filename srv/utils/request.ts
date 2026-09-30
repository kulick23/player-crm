import cds, { Request, Service, Transaction } from '@sap/cds';
import type { Player } from '#cds-models/PlayerCRMService';

const { SELECT } = cds.ql;

export const boundPlayerID = (req: Request): string => {
  const ID = (req.params[0] as { ID?: string } | undefined)?.ID;
  if (!ID) req.reject(400, 'A player has to be selected');
  return ID;
};

export const campaignIDFrom = (req: Request): string => {
  const campaignID = req.data.campaign_ID as string | undefined;
  if (!campaignID) req.reject(400, 'A campaign has to be selected');
  return campaignID;
};

export const readPlayer = async (
  srv: Service,
  tx: Transaction,
  playerID: string
): Promise<Player | undefined> =>
  tx.run(
    SELECT.one.from(srv.entities.Players).where({ ID: playerID })
  ) as Promise<Player | undefined>;
