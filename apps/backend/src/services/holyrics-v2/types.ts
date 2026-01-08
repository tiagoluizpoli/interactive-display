import type { Browser, Page } from 'puppeteer';
import type { HolyricsConfig, StatusNotifier } from '@/config';

/**
 * @interface BibleVerse
 * @description Defines the structure for a single Bible verse.
 * It includes the `reference` (e.g., "John 3:16"), the `text` of the verse, and the `version` (e.g., "NIV").
 */
export interface BibleVerse {
  reference: string;
  text: string;
  version: string;
}

/**
 * @interface MonitorBibleOutputParams
 * @description Specifies the parameters required for the `monitorBibleOutput` method.
 * Primarily, it includes a `callback` function that will be invoked with updated Bible verses.
 */
export interface MonitorBibleOutputParams {
  callback: (bibleVerse: BibleVerse | undefined) => void;
}

/**
 * @interface BrowserManagerConfig
 * @description Configuration options for the BrowserManager.
 */
export interface BrowserManagerConfig {
  headless: boolean; // Reverted to boolean to match puppeteer's default headless behavior.
  executablePath: string;
  args: string[];
  defaultNavigationTimeoutMs: number;
  loggerName: string;
}

/**
 * @interface HolyricsServiceConfig
 * @description Configuration options for the Holyrics service.
 */
export interface HolyricsServiceConfig {
  URL: string;
  TIMEOUT: number;
  RETRY_TIME: number;
  MAX_NETWORK_FAILURES: number;
  POLLING_INTERVAL_MS: number;
  REFERENCE_SELECTOR: string;
  TEXT_SELECTOR: string;
  VERSION_SELECTOR: string;
  loggerName?: string; // Made optional to match config-validator.ts schema
}

// Re-export HolyricsConfig and StatusNotifier for convenience within holyrics-v2
export type { HolyricsConfig, StatusNotifier, Browser, Page };
