import type { ConfigType } from '@/config';
import { createChildLogger } from '@/config/logger';

export interface IPresentation {
  type: ConfigType;
  execute: () => Promise<void>;
  setDisplayEnabled: (displayEnabled: boolean) => void;
  emit: () => void;
  emitFailure?: (event: string, data: any) => void;
  destroy: () => void;
}

export class Orchestrator {
  private readonly logger = createChildLogger('Orchestrator');
  private presentations: IPresentation[] = [];

  isPresentationActive(type: ConfigType): boolean {
    return this.presentations.some((p) => p.type === type);
  }

  addPresentation(presentation: IPresentation): void {
    presentation.execute();
    this.logger.info('add presentation', { type: presentation.type });
    this.presentations.push(presentation);
  }

  public getPresentation(type: ConfigType): IPresentation | undefined {
    return this.presentations.find((p) => p.type === type);
  }

  removePresentation(type: ConfigType) {
    const presentation = this.presentations.filter((p) => p.type === type);
    if (!presentation.length) {
      return;
    }
    for (const p of presentation) {
      p.destroy();
    }

    this.presentations = this.presentations.filter((p) => p.type !== type);
  }

  public async execute(): Promise<void> {
    this.logger.info('Executing presentations');
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
  }
}
