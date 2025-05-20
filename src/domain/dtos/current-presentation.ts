import type { Presentation } from '../entities';

export interface CurrentPresentationDto {
  presentation?: Presentation | null;
  displayEnabled?: boolean;
}
