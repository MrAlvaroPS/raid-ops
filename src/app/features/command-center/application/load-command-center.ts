import { CommandCenterScope, CommandCenterSnapshot } from '../domain/command-center.models';
import { CommandCenterRepository } from './command-center.repository';

export class LoadCommandCenter {
  constructor(private readonly repository: CommandCenterRepository) {}

  execute(scope: CommandCenterScope): Promise<CommandCenterSnapshot> {
    return this.repository.load(scope);
  }
}
