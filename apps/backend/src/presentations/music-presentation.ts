import type { PresentationSlideIndexParams, ProPresenter } from '@/infrastructure';

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

    this.proPresenter.onPublicStateChange(this.setDisplayEnabled);
  }

  private setMusic = async (music: Music | null): Promise<void> => {
    this.music = music;
    this.proPresenter.onPresentationSlideIndexChanged(this.setCurrentSlide);
  };

  private setCurrentSlide = async (params: PresentationSlideIndexParams | null): Promise<void> => {
    if (!this.music || !params) {
      console.log('no music');
      this.currentSlide = null;
      this.emit();
      return;
    }
    const { presentationUuid, slideIndex } = params;

    this.currentSlide =
      presentationUuid === this.music.presentation.id.uuid
        ? this.music.presentation.groups[0].slides[slideIndex]
        : null;

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
