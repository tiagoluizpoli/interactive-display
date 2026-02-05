import type { IPresentation } from './orchestrator';
import { io } from '@/server';
import { createChildLogger } from '@/config/logger';
import type { ConfigType } from '@/config';
import type { Holyrics, BibleVerse } from '@/services';

export class BiblePresentation implements IPresentation {
  type: ConfigType = 'holyrics';
  private bibleVerse: BibleVerse | null = null;
  private readonly logger = createChildLogger('BiblePresentation');

  constructor(public readonly holyricsService: Holyrics) {} // Exposed as public for config updates

  private setBibleVerse = (bibleVerse?: BibleVerse) => {
    this.bibleVerse = bibleVerse ?? null;
    this.emit();
  };

  execute = async (): Promise<void> => {
    this.logger.info('Starting Bible output monitoring');
    await this.holyricsService.monitorBibleOutput({
      callback: this.setBibleVerse,
    });
  };
  setDisplayEnabled = (displayEnabled: boolean): void => {
    this.logger.warn('setDisplayEnabled not implemented', { displayEnabled });
  };

  emit = (): void => {
    io.emit('bible-slide', this.bibleVerse);
    this.logger.debug('Emitted bible-slide event', {
      bibleVerse: this.bibleVerse,
    });
  };

  emitFailure? = (event: string, data: any): void => {
    io.emit(event, data);
    this.logger.debug('Emitted failure event', { event, data });
  };

  destroy(): void {
    this.logger.info('Destroying resources');
    this.holyricsService.destroy();
  }
}
