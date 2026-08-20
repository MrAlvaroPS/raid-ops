import { ProgressHistoryIndex, ProgressScope, ProgressSnapshot } from '../domain/progress.models';
import { ProgressRepository } from './progress.repository';

export class LoadProgress {
  constructor(private readonly repository: ProgressRepository) {}

  index(): Promise<ProgressHistoryIndex> {
    return this.repository.loadIndex();
  }

  scope(scope: ProgressScope): Promise<ProgressSnapshot> {
    return this.repository.loadScope(scope);
  }
}
