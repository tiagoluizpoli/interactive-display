import type { Presentation } from '../../models';

export interface PresentationRepository {
  create(presentation: Presentation): Promise<void>;
  getPresentationByCode(code: string): Promise<Presentation | undefined>;
}
