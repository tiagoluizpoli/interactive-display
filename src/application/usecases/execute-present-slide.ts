import type { PresentSlide } from '../../domain';
import { io } from '../../main/server';
import type { ListenToSlideChange, Slide } from '../contracts';

export class ExecutePresentSlide implements PresentSlide {
  constructor(private readonly listenToSlideChange: ListenToSlideChange) {}

  async execute(): Promise<void> {
    await this.listenToSlideChange.onSlideChange(this.presentSlide);
  }

  private async presentSlide(slide: Slide): Promise<void> {
    io.emit('slide', slide);
  }
}
