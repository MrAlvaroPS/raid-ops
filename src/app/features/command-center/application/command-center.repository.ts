import { CommandCenterScope, CommandCenterSnapshot } from '../domain/command-center.models';

export interface CommandCenterRepository {
  load(scope: CommandCenterScope): Promise<CommandCenterSnapshot>;
}
