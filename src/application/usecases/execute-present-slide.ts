import type { PresentSlide } from '../../domain';
import { io } from '../../main/server';
import type { ListenToSlideChange, PresentationRepository } from '../contracts';

export class ExecutePresentSlide implements PresentSlide {
  constructor(
    private readonly presentationRepository: PresentationRepository,
    private readonly listenToSlideChange: ListenToSlideChange,
  ) {}

  async execute(): Promise<void> {
    console.log(this.presentationRepository);

    await this.listenToSlideChange.onSlideChange(async (code) => {
      console.log(code);
      const presentation = await this.presentationRepository.getPresentationByCode(code);

      io.emit('slide', presentation);
    });
  }
}
