import { CompositionScope, CompositionSnapshot } from '../domain/composition.models';

export interface CompositionRepository {
  load(scope: CompositionScope): Promise<CompositionSnapshot>;
}
