import type { PresentationSlideIndexParams, ProPresenter, StreamSubscription } from '@/services';

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
  private slides: Slide[] = [];
  private subscriptions: StreamSubscription[] = [];

  constructor(private readonly proPresenter: ProPresenter) {}

  async execute(): Promise<void> {
    this.subscriptions.push(await this.proPresenter.onPresentationFocusedChanged(this.setMusic));
  }

  destroy(): void {
    this.subscriptions.forEach((s) => s.destroy());
  }

  private setMusic = async (music: Music | null): Promise<void> => {
    this.music = music;
    this.slides =
      this.music?.presentation.groups.reduce<Slide[]>((acc, curr) => {
        acc.push(...curr.slides);
        return acc;
      }, []) ?? [];
    this.subscriptions.push(await this.proPresenter.onPresentationSlideIndexChanged(this.setCurrentSlide));
  };

  private setCurrentSlide = async (params: PresentationSlideIndexParams | null): Promise<void> => {
    if (!this.music || !params) {
      this.currentSlide = null;
      this.emit();
      return;
    }
    const { presentationUuid, slideIndex } = params;

    this.currentSlide = presentationUuid === this.music.presentation.id.uuid ? this.slides[slideIndex] : null;

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
