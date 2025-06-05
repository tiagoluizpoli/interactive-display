import type { ProPresenter } from '@/infrastructure';

import type { Music, Slide } from '@/models/music';
import type { IPresentation } from './local-persistence';
import { io } from '@/server';

export interface CurrentMusicDto {
  currentSlide?: Slide | null;
  displayEnabled?: boolean;
}
export class MusicPresentation implements IPresentation {
  music?: Music | null;
  currentSlide?: Slide | null;
  displayEnabled = false;

  constructor(private readonly proPresenter: ProPresenter) {}

  async execute(): Promise<void> {
    this.proPresenter.onPresentationFocusedChanged(this.setMusic);

    this.proPresenter.onPresentationSlideIndexChanged(this.setCurrentSlide);

    this.proPresenter.onPublicStateChange(this.setDisplayEnabled);
  }

  private setMusic = async (music: Music | null): Promise<void> => {
    this.music = music;
  };

  private setCurrentSlide = async (slideIndex: number | null): Promise<void> => {
    if (!this.music) {
      this.currentSlide = null;
      this.emit();
      return;
    }

    this.currentSlide = slideIndex !== null ? this.music.presentation.groups[0].slides[slideIndex] : null;

    this.emit();
  };

  setDisplayEnabled = (displayEnabled: boolean): void => {
    this.displayEnabled = displayEnabled;

    this.emit();
  };

  emit(): void {
    io.emit('music-slide', this.toJSON());
  }

  private toJSON(): CurrentMusicDto {
    return {
      currentSlide: this.currentSlide,
      displayEnabled: this.displayEnabled,
    };
  }
}
