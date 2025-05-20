import type { CurrentPresentationDto, PresentSlide } from '../../domain';
import { io } from '../../main/server';
import type { ListenToSlideChange, PresentationRepository } from '../contracts';

export class ExecutePresentSlide implements PresentSlide {
  constructor(
    private readonly presentationRepository: PresentationRepository,
    private readonly listenToSlideChange: ListenToSlideChange,
  ) {}

  async execute(): Promise<void> {
    this.listenToSlideChange.onSlideChange(async (code) => {
      const presentation = await this.presentationRepository.getPresentationByCode(code);

      await this.presentationRepository.setCurrentPresentation(presentation ?? null);

      const displayEnabled = await this.presentationRepository.getDisplayEnabled();

      const currentPresentation = {
        presentation,
        displayEnabled,
      };
      io.emit('slide', currentPresentation);
    });

    this.listenToSlideChange.onPublicStateChange(async (enabled) => {
      await this.presentationRepository.setDisplayEnabled(enabled);

      const presentation = await this.presentationRepository.getCurrentPresentation();

      const currentPresentation: CurrentPresentationDto = {
        presentation,
        displayEnabled: enabled,
      };

      io.emit('slide', currentPresentation);
    });
  }
}
