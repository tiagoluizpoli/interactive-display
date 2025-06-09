import type { ProPresenter } from '@/infrastructure';

export interface IPresentation {
  execute: () => Promise<void>;
  setDisplayEnabled: (displayEnabled: boolean) => void;
  emit: () => void;
}

export class LocalPersistence {
  constructor(
    private readonly presentations: IPresentation[],
    private readonly proPresenter: ProPresenter,
  ) {
    this.setDisplayEnabled(false);

    this.proPresenter.onPublicStateChange((state) => this.setDisplayEnabled(state));
  }

  public async execute(): Promise<void> {
    for (const presentation of this.presentations) {
      presentation.execute();
    }
  }

  public setDisplayEnabled(displayEnabled: boolean): void {
    for (const presentation of this.presentations) {
      presentation.setDisplayEnabled(displayEnabled);
    }
  }

  public emit(): void {
    for (const presentation of this.presentations) {
      presentation.emit();
    }
  }
}
