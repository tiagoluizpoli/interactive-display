export interface IPresentation {
  execute: () => Promise<void>;
  setDisplayEnabled: (displayEnabled: boolean) => void;
  emit: () => void;
}

export class LocalPersistence {
  constructor(private readonly presentations: IPresentation[]) {
    this.setDisplayEnabled(false);
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
