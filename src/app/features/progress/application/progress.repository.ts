import { ProgressHistoryIndex, ProgressScope, ProgressSnapshot } from '../domain/progress.models';

export abstract class ProgressRepository {
  abstract loadIndex(): Promise<ProgressHistoryIndex>;
  abstract loadScope(scope: ProgressScope): Promise<ProgressSnapshot>;
}
