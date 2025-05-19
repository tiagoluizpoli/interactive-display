import type { Presentation } from '../../../domain';

export interface PresentationRepository {
  create(presentation: Presentation): Promise<void>;
  getPresentationByCode(code: string): Promise<Presentation | undefined>;
}
