import type { BibleVerse, HolyricsBible } from '@/infrastructure';
import type { IPresentation } from './local-persistence';
import { io } from '@/server';

export class BiblePresentation implements IPresentation {
  private bibleVerse: BibleVerse | null = null;
  constructor(private readonly holyricsBible: HolyricsBible) {}

  private setBibleVerse = (bibleVerse?: BibleVerse) => {
    // if (this.bibleVerse?.reference === bibleVerse?.reference) {
    //   return;
    // }
    this.bibleVerse = bibleVerse ?? null;
    this.emit();
  };

  execute = async (): Promise<void> => {
    await this.holyricsBible.monitorBibleOutput({ callback: this.setBibleVerse });
  };
  setDisplayEnabled = (displayEnabled: boolean): void => {
    console.log(`BiblePresentation :: setDisplayEnabled :: Not implemented :: ${displayEnabled}`);
  };

  emit = (): void => {
    io.emit('bible-slide', this.bibleVerse);
  };

  destroy(): void {
    this.holyricsBible.destroy();
  }
}
