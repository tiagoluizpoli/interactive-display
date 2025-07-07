import type { Presentation } from '@/models';
import type { ProPresenter } from '../infrastructure';
import type { PresentationRepository } from '../infrastructure/db';
import type { IPresentation } from './local-persistence';
import { io } from '@/server';

export interface CurrentPresentationDto {
  presentation?: Presentation | null;
  displayEnabled?: boolean;
}

export class BannerPresentation implements IPresentation {
  presentation?: Presentation | null;
  displayEnabled = false;

  constructor(
    private readonly presentationRepository: PresentationRepository,
    private readonly proPresenter: ProPresenter,
  ) {}

  async execute(): Promise<void> {
    this.proPresenter.onSlideChange(this.setPresentation);
  }

  private setPresentation = async (code: string) => {
    this.presentation = await this.presentationRepository.getPresentationByCode(code);

    this.emit();
  };

  setDisplayEnabled = async (displayEnabled: boolean): Promise<void> => {
    this.displayEnabled = displayEnabled;
    this.emit();
  };

  public emit(): void {
    io.emit('slide', this.toJSON());
  }

  private toJSON(): CurrentPresentationDto {
    return {
      presentation: this.presentation,
      displayEnabled: this.displayEnabled,
    };
  }
}
