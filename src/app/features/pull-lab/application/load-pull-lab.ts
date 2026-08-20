import { PullLabScope, PullLabSnapshot } from '../domain/pull-lab.models';
import { PullLabRepository } from './pull-lab.repository';

export class LoadPullLab {
  constructor(private readonly repository: PullLabRepository) {}

  execute(scope: PullLabScope): Promise<PullLabSnapshot> {
    return this.repository.load(scope);
  }
}
