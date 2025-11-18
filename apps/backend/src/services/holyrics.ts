import type { HolyricsConfig, Notifier } from '@/config';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import { createChildLogger } from '../config/logger';
import { delay } from '@/utils';

export interface BibleVerse {
  reference: string;
  text: string;
  version: string;
}

interface MonitorBibleOutputParams {
  callback: (bibleVerse: BibleVerse | undefined) => void;
}

export class HolyricsBible {
  private browser?: Browser;
  private page?: Page;
  private previousBibleVerse?: BibleVerse;
  private intervalId?: NodeJS.Timeout;
  private readonly logger = createChildLogger('HolyricsBible');
  private isConnecting = false;

  constructor(
    private readonly holyrics: HolyricsConfig,
    private readonly notifier: Notifier,
  ) {}

  private launchBrowser = async () => {
    this.browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--no-zygote',
        '--single-process', // This might help in some environments
      ],
    });

    this.page = await this.browser.newPage();
  };

  private connectToHolyrics = async () => {
    if (this.isConnecting) return false;

    this.isConnecting = true;

    try {
      if (!this.browser) {
        await this.launchBrowser();
      }

      await this.page!.goto(this.holyrics.URL, {
        waitUntil: 'domcontentloaded',
        timeout: this.holyrics.TIMEOUT * 1000,
      });
      this.logger.info('Successfully loaded Holyrics page', { url: this.holyrics.URL });
      this.notifier.addNotification({
        type: 'status',
        layer: 'holyrics',
        context: {
          message: 'holyrics on',
          data: { status: true },
        },
      });

      this.isConnecting = false;
      return true;
    } catch (error) {
      const errorMessage = (error as Error).message.split('\n')[0];

      const executablePathMatch = errorMessage.match(/executablePath \((.*?)\)/);
      const executablePath = executablePathMatch ? executablePathMatch[1] : undefined;

      this.logger.error('Failed to connect to Holyrics', {
        error: errorMessage,
        executablePath,
      });

      this.notifier.addNotification({
        type: 'connection-issue',
        layer: 'holyrics',
        context: {
          message: 'Failed to connect to Holyrics',
          data: {
            url: this.holyrics.URL,
          },
        },
      });

      if (this.browser) {
        this.logger.warn('Closing browser for cleanup due to connection error');
        await this.browser.close();
        this.browser = undefined;
        this.page = undefined;
      }

      this.isConnecting = false;
      return false;
    } finally {
      this.isConnecting = false;
    }
  };

  private handleReconnection = async (): Promise<void> => {
    if (this.browser) {
      this.logger.info('Closing existing browser for reconnection');
      await this.browser.close();
      this.browser = undefined;
      this.page = undefined;
    }

    while (!(await this.connectToHolyrics())) {
      this.logger.warn('Reconnection attempt failed', { retryTimeSeconds: this.holyrics.RETRY_TIME });

      await delay(this.holyrics.RETRY_TIME * 1000);
    }
  };

  private startPollling = async ({ callback }: MonitorBibleOutputParams): Promise<void> => {
    this.intervalId = setInterval(async () => {
      if (!this.page || this.isConnecting) {
        return;
      }

      // Check if the page is closed or crashed
      // Puppeteer doesn't expose isCrashed directly, but we can check if the browser is still connected
      const browserConnected = this.browser?.connected;
      if (!browserConnected || this.page.isClosed()) {
        this.logger.error('Page or browser is disconnected/crashed. Attempting reconnection');
        this.notifier.addNotification({
          type: 'connection-issue',
          layer: 'holyrics',
          context: {
            message: 'Page or browser is disconnected/crashed. Attempting reconnection',
          },
        });
        await this.handleReconnection();
        return;
      }

      try {
        const currentBibleVerse = await this.page.evaluate(
          (referenceSelector: string, textSelector: string, versionSelector: string) => {
            const referenceHtmlObject = document.querySelector(referenceSelector);
            const texHtmlObjectt = document.querySelector(textSelector);
            const versionHtmlObject = document.querySelector(versionSelector);

            const reference = referenceHtmlObject?.textContent?.trim().replace(/\s\s+/g, ' ');
            const text = texHtmlObjectt?.textContent?.trim().replace(/\s\s+/g, ' ');
            const version = versionHtmlObject?.textContent?.trim().replace(/\s\s+/g, ' ');

            if (
              !reference ||
              !text ||
              !version ||
              typeof reference !== 'string' ||
              typeof text !== 'string' ||
              typeof version !== 'string'
            )
              return;

            return {
              reference,
              text,
              version,
            };
          },
          this.holyrics.REFERENCE_SELECTOR,
          this.holyrics.TEXT_SELECTOR,
          this.holyrics.VERSION_SELECTOR,
        );

        if (this.previousBibleVerse && !currentBibleVerse) {
          this.previousBibleVerse = undefined;
          return callback(undefined);
        }

        if (
          this.previousBibleVerse &&
          currentBibleVerse &&
          this.previousBibleVerse.reference === currentBibleVerse.reference
        ) {
          return;
        }

        if (!currentBibleVerse) return;

        this.previousBibleVerse = currentBibleVerse;

        callback(currentBibleVerse);
      } catch (error) {
        const errorMessage = (error as Error).message.split('\n')[0];
        this.logger.error('Failed to read DOM during polling', { error: errorMessage });
        this.notifier.addNotification([
          {
            type: 'puppetter-issue',
            layer: 'holyrics',
            context: {
              message: errorMessage,
            },
          },
          {
            type: 'status',
            layer: 'holyrics',
            context: {
              message: 'holyrics off',
              data: { status: false },
            },
          },
        ]);

        // If an error occurs during evaluation, it might indicate a problem with the page.
        // Attempt to reconnect to ensure a fresh page instance.
        if (!this.isConnecting) {
          this.logger.warn('DOM reading failed. Attempting reconnection');
          await this.handleReconnection();
        }
      }
    }, this.holyrics.POLLING_INTERVAL_MS);
  };

  monitorBibleOutput = async (params: MonitorBibleOutputParams) => {
    this.logger.info('Starting Holyrics monitoring');

    await this.handleReconnection();

    this.startPollling(params);

    this.logger.info('Holyrics monitoring started');
    this.notifier.addNotification([
      {
        type: 'status',
        layer: 'holyrics',
        context: {
          message: 'holyrics on',
          data: { status: true },
        },
      },
    ]);

    process.on('SIGINT', async () => {
      await this.destroy();
    });
  };

  public destroy = async (): Promise<void> => {
    this.logger.info('Cleaning up resources');
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    if (this.page) {
      try {
        await this.page.close();
      } catch (error) {
        this.logger.error('Failed to close page', { error: (error as Error).message });
      } finally {
        this.page = undefined;
      }
    }
    if (this.browser) {
      try {
        await this.browser.close();
        this.notifier.addNotification({
          type: 'status',
          layer: 'holyrics',
          context: {
            message: 'holyrics off',
            data: { status: false },
          },
        });
      } catch (error) {
        this.logger.error('Failed to close browser', { error: (error as Error).message });
      } finally {
        this.browser = undefined;
      }
    }
    this.isConnecting = false;
    this.previousBibleVerse = undefined;
  };
}
