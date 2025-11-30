import puppeteer from 'puppeteer';
import { createChildLogger } from '@/config/logger';
import type { Browser, Page, BrowserManagerConfig } from './types';

/**
 * @class BrowserManager
 * @description Manages the Puppeteer browser and page instances, ensuring a single,
 * lightweight, and resilient browser session. It handles launching, closing,
 * and navigating the browser, with a focus on resource efficiency and proper cleanup.
 */
export class BrowserManager {
  private browser?: Browser;
  private page?: Page;
  private readonly logger;

  /**
   * @constructor
   * @param {BrowserManagerConfig} config - Configuration options for the browser manager,
   *                                        including headless mode, executable path, arguments, and timeouts.
   */
  constructor(private readonly config: BrowserManagerConfig) {
    this.logger = createChildLogger(`${config.loggerName}:BrowserManager`);
  }

  /**
   * @method launch
   * @description Launches a new Puppeteer browser instance in a lightweight configuration.
   * If a browser is already active, it will be closed first to ensure a single instance.
   * @returns {Promise<void>}
   */
  public async launch(): Promise<void> {
    if (this.browser) {
      this.logger.debug('Existing browser instance detected. Closing before launching a new one.');
      await this.close();
    }

    this.logger.info('Launching new browser instance...');
    try {
      this.browser = await puppeteer.launch({
        headless: this.config.headless,
        executablePath: this.config.executablePath || process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome',
        args: this.config.args || [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--no-zygote',
          '--single-process',
        ],
      });
      this.page = await this.browser.newPage();
      this.logger.info('Browser launched and new page created.');
    } catch (error) {
      this.logger.error('Failed to launch browser or create new page', { error: (error as Error).message });
      await this.close(); // Ensure cleanup on failure
      throw error;
    }
  }

  /**
   * @method close
   * @description Gracefully closes the Puppeteer page and browser instances, ensuring all resources are purged.
   * It handles cases where the browser or page might already be closed or undefined.
   * @returns {Promise<void>}
   */
  public async close(): Promise<void> {
    this.logger.info('Attempting to close browser and page...');
    if (this.page) {
      try {
        await this.page.close();
        this.page = undefined;
        this.logger.debug('Page closed successfully.');
      } catch (error) {
        this.logger.warn('Failed to close page gracefully', { error: (error as Error).message });
      }
    }

    if (this.browser) {
      try {
        await this.browser.close();
        this.browser = undefined;
        this.logger.info('Browser closed successfully.');
      } catch (error) {
        this.logger.warn('Failed to close browser gracefully', { error: (error as Error).message });
      }
    }
  }

  public async manageListeners(callback: (page: Page) => Promise<void>) {
    if (!this.page) {
      this.logger.warn('Cannot set listeners: page is not initialized.');
      return;
    }
    await callback(this.page);
  }

  /**
   * @method navigate
   * @description Navigates the current page to the specified URL.
   * Throws an error if the page is not available or navigation fails.
   * @param {string} url - The URL to navigate to.
   * @param {number} timeoutMs - Optional timeout in milliseconds for the navigation. Defaults to config.defaultNavigationTimeoutMs.
   * @returns {Promise<void>}
   */
  public async navigate(url: string, timeoutMs?: number): Promise<void> {
    if (!this.page) {
      const errorMessage = 'Cannot navigate: page is not initialized.';
      this.logger.error(errorMessage, { url });
      throw new Error(errorMessage);
    }

    const navigationTimeout = timeoutMs || this.config.defaultNavigationTimeoutMs;
    this.logger.debug(`Navigating to URL: ${url} with timeout: ${navigationTimeout}ms`);

    try {
      await this.page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: navigationTimeout,
      });
      this.logger.info(`Successfully navigated to ${url}`);
    } catch (error) {
      const errorMessage = `Failed to navigate to ${url}`;
      this.logger.error(errorMessage, { url, error: (error as Error).message });
      throw new Error(errorMessage);
    }
  }

  public isPageOpen(): boolean {
    return !this.page?.isClosed();
  }

  public isBrowserConnected(): boolean {
    return !this.browser?.connected;
  }

  public async evaluate(evaluate: (page: Page) => Promise<void>) {
    if (this.page) {
      await evaluate(this.page);
      return;
    }

    this.logger.warn('Cannot evaluate: page is not initialized.');
  }

  public async getOpenPagesCount(): Promise<number> {
    return (await this.browser?.pages())?.length || 0;
  }
}
