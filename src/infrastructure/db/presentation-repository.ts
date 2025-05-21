import type { Presentation } from '../../models';

export interface PresentationRepository {
  create(presentation: Presentation): Promise<void>;
  getPresentationByCode(code: string): Promise<Presentation | undefined>;
  setCurrentPresentation(currentPresentation: Presentation | null): Promise<void>;
  getCurrentPresentation(): Promise<Presentation | undefined>;
  setDisplayEnabled(displayEnabled: boolean): Promise<void>;
  getDisplayEnabled(): Promise<boolean>;
}
