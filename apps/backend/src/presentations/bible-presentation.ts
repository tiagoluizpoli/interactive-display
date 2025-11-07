import type { BibleVerse, HolyricsBible } from '@/infrastructure';
import type { IPresentation } from './local-persistence';
import { io } from '@/server';
import { createChildLogger } from '../config/logger';

export class BiblePresentation implements IPresentation {
  private bibleVerse: BibleVerse | null = null;
  private readonly logger = createChildLogger('BiblePresentation');

  constructor(private readonly holyricsBible: HolyricsBible) {}

  private setBibleVerse = (bibleVerse?: BibleVerse) => {
    // if (this.bibleVerse?.reference === bibleVerse?.reference) {
    //   return;
    // }
    this.bibleVerse = bibleVerse ?? null;
    this.emit();
  };

  execute = async (): Promise<void> => {
    this.logger.info('Starting Bible output monitoring');
    await this.holyricsBible.monitorBibleOutput({ callback: this.setBibleVerse });
  };
  setDisplayEnabled = (displayEnabled: boolean): void => {
    this.logger.warn('setDisplayEnabled not implemented', { displayEnabled });
  };

  emit = (): void => {
    io.emit('bible-slide', this.bibleVerse);
    this.logger.debug('Emitted bible-slide event', { bibleVerse: this.bibleVerse });
  };

  destroy(): void {
    this.logger.info('Destroying resources');
    this.holyricsBible.destroy();
  }
}
