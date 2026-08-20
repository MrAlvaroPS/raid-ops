import { PlayersScope, PlayersSnapshot } from '../domain/players.models';

export interface PlayersRepository {
  load(scope: PlayersScope): Promise<PlayersSnapshot>;
}
