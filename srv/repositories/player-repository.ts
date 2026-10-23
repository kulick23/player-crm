import cds, { Transaction } from '@sap/cds';
import type { Player, PlayerStatu } from '#cds-models/playercrm';

import { ENTITIES } from './entities';

const { SELECT, UPDATE } = cds.ql;

export const findPlayer = async (
  tx: Transaction,
  playerID: string
): Promise<Player | undefined> =>
  tx.run(SELECT.one.from(ENTITIES.player).where({ ID: playerID })) as Promise<Player | undefined>;

export const updatePlayer = async (
  tx: Transaction,
  playerID: string,
  changes: Partial<Player>
): Promise<void> => {
  await tx.run(UPDATE.entity(ENTITIES.player, playerID).with(changes));
};

export const findStatusByID = async (
  tx: Transaction,
  statusID?: string | null
): Promise<PlayerStatu | undefined> => {
  if (!statusID) return undefined;
  return tx.run(
    SELECT.one.from(ENTITIES.playerStatus).where({ ID: statusID })
  ) as Promise<PlayerStatu | undefined>;
};

export const findStatusByCode = async (
  tx: Transaction,
  code: string
): Promise<PlayerStatu | undefined> =>
  tx.run(
    SELECT.one.from(ENTITIES.playerStatus).where({ code })
  ) as Promise<PlayerStatu | undefined>;
