import { io } from '@/server';
import type { Music, Slide } from './music';

export interface CurrentMusicDto {
  currentSlide?: Slide | null;
  displayEnabled?: boolean;
}

export class CurrentMusic {
  music?: Music | null;
  currentSlide?: Slide | null;
  displayEnabled?: boolean;

  constructor() {
    this.music = null;
    this.currentSlide = null;
    this.displayEnabled = false;
  }

  setMusic(music: Music | null): void {
    this.music = music;
  }

  setCurrentSlide(slideIndex: number | null): void {
    if (!this.music) {
      this.currentSlide = null;
      this.emit();
      return;
    }

    this.currentSlide = slideIndex !== null ? this.music.presentation.groups[0].slides[slideIndex] : null;

    console.log(this.toJSON());
    this.emit();
  }

  public setDisplayEnabled(displayEnabled: boolean): void {
    this.displayEnabled = displayEnabled;

    this.emit();
  }

  public emit(): void {
    io.emit('music-slide', this.toJSON());
  }

  private toJSON(): CurrentMusicDto {
    return {
      currentSlide: this.currentSlide,
      displayEnabled: this.displayEnabled,
    };
  }
}
