import type { Presentation } from '@/models';
import type { ProPresenter, StreamSubscription } from '../infrastructure';
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
  private subscription?: StreamSubscription;

  constructor(
    private readonly presentationRepository: PresentationRepository,
    private readonly proPresenter: ProPresenter,
  ) {}

  async execute(): Promise<void> {
    this.subscription = await this.proPresenter.onSlideChange(this.setPresentation);
  }

  destroy(): void {
    this.subscription?.destroy();
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
