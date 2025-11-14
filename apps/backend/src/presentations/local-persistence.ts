import type { ProPresenter, StreamSubscription } from '@/services';

export interface IPresentation {
  execute: () => Promise<void>;
  setDisplayEnabled: (displayEnabled: boolean) => void;
  emit: () => void;
  destroy: () => void;
}

export class LocalPersistence {
  private readonly subscriptions: StreamSubscription[] = [];
  constructor(
    private readonly presentations: IPresentation[],
    private readonly proPresenter: ProPresenter,
  ) {
    this.setDisplayEnabled(false);

    this.proPresenter
      .onPublicStateChange((state) => this.setDisplayEnabled(state))
      .then((s) => this.subscriptions.push(s));
  }

  public async execute(): Promise<void> {
    const promises = this.presentations.map((p) => p.execute());
    await Promise.all(promises);
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

  public destroy(): void {
    for (const presentation of this.presentations) {
      presentation.destroy();
    }
    for (const subscription of this.subscriptions) {
      subscription.destroy();
    }
  }
}
