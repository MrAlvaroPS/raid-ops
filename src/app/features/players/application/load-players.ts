import { PlayersRepository } from './players.repository';
import { PlayersScope, PlayersSnapshot } from '../domain/players.models';

export class LoadPlayers {
  constructor(private readonly repository: PlayersRepository) {}

  execute(scope: PlayersScope): Promise<PlayersSnapshot> {
    return this.repository.load(scope);
  }
}
