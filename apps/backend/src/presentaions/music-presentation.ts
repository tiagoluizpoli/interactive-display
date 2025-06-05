import type { PresentationRepository, ProPresenter } from '@/infrastructure';
import { CurrentMusic } from '@/models/current-music';
import type { Music } from '@/models/music';

import type { IPresentation } from '@/presentaions/local-persistence';

export class MusicPresentation implements IPresentation {
  currentMusic = new CurrentMusic();
  constructor(
    private readonly presentationRepository: PresentationRepository,
    private readonly proPresenter: ProPresenter,
  ) {}
  async execute(): Promise<void> {
    this.proPresenter.onPresentationFocusedChanged(this.setMusic);

    this.proPresenter.onPresentationSlideIndexChanged(this.setCurrentSlide);

    this.proPresenter.onPublicStateChange(this.setDisplayEnabled);
  }

  private setMusic = async (music: Music | null): Promise<void> => {
    this.currentMusic.setMusic(music);
  };

  private setCurrentSlide = async (slideIndex: number | null): Promise<void> => {
    this.currentMusic.setCurrentSlide(slideIndex);
  };

  setDisplayEnabled = (displayEnabled: boolean): void => {
    this.currentMusic.setDisplayEnabled(displayEnabled);
  };

  emit(): void {
    this.currentMusic.emit();
  }
}
