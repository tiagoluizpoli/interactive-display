import { CurrentPresentation } from '@/models';
import type { ProPresenter } from '../infrastructure';
import type { PresentationRepository } from '../infrastructure/db';
import type { IPresentation } from './local-persistence';

export class BannerPresentation implements IPresentation {
  currentPresentation = new CurrentPresentation();

  constructor(
    private readonly presentationRepository: PresentationRepository,
    private readonly proPresenter: ProPresenter,
  ) {}
  setDisplayEnabled(displayEnabled: boolean): void {
    this.currentPresentation.setDisplayEnabled(displayEnabled);
  }

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

  public emit(): void {
    this.currentPresentation.emitCurrentPresentation();
  }
}
