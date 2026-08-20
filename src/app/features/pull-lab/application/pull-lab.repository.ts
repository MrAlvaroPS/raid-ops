import { PullLabScope, PullLabSnapshot } from '../domain/pull-lab.models';

export abstract class PullLabRepository {
  abstract load(scope: PullLabScope): Promise<PullLabSnapshot>;
}
