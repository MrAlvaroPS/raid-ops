import { CompositionScope, CompositionSnapshot } from '../domain/composition.models';
import { CompositionRepository } from './composition.repository';

export class LoadComposition {
  constructor(private readonly repository: CompositionRepository) {}

  execute(scope: CompositionScope): Promise<CompositionSnapshot> {
    return this.repository.load(scope);
  }
}
