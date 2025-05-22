import type { PresentationRepository } from './infrastructure/db';
import { CurrentPresentation } from './models';
import type { ProPresenter } from './infrastructure';

export class Present {
  private currentPresentation: CurrentPresentation = new CurrentPresentation();

  constructor(
    private readonly presentationRepository: PresentationRepository,
    private readonly proPresenter: ProPresenter,
  ) {}

  async execute(): Promise<void> {
    this.proPresenter.onSlideChange(this.onSlideChangeHook);

    this.proPresenter.onPublicStateChange(this.onPublicStateChangeHook);
  }

  private onSlideChangeHook = async (code: string) => {
    const presentation = await this.presentationRepository.getPresentationByCode(code);

    this.currentPresentation.setPresentation(presentation ?? null);
  };

  private onPublicStateChangeHook = async (enabled: boolean) => {
    this.currentPresentation.setDisplayEnabled(enabled);
  };

  public emitCurrentPresentation(): void {}
}
