import type { HolyricsConfig, StatusNotifier } from '@/config';
import puppeteer, { type Browser, type Page, type HTTPRequest } from 'puppeteer';
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
  private isReconnecting = false; // New flag to prevent parallel handleReconnection calls
  private networkFailureCount = 0;
  private boundHandleRequest?: (request: HTTPRequest) => void;
  private boundHandleRequestFailed?: (request: HTTPRequest) => void;

  constructor(
    private readonly holyrics: HolyricsConfig,
    private readonly notifier: StatusNotifier,
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

      // Ensure any old listeners are removed before attaching new ones
      if (this.page) {
        if (this.boundHandleRequest) {
          this.page.off('request', this.boundHandleRequest);
        }
        if (this.boundHandleRequestFailed) {
          this.page.off('requestfailed', this.boundHandleRequestFailed);
        }
      }

      await this.page!.setRequestInterception(true);
      this.boundHandleRequestFailed = this.handleRequestFailed.bind(this);
      this.page!.on('requestfailed', this.boundHandleRequestFailed);

      // Ensure requests continue
      this.boundHandleRequest = async (request: HTTPRequest) => {
        request.continue();
      };
      this.page!.on('request', this.boundHandleRequest);

      this.logger.info('Puppeteer request interception enabled.');

      this.logger.debug(`Navigating to Holyrics URL: ${this.holyrics.URL}`);
      const navigationStartTime = process.hrtime.bigint();

      await this.page!.goto(this.holyrics.URL, {
        waitUntil: 'domcontentloaded',
        timeout: this.holyrics.TIMEOUT * 1000,
      });

      const navigationEndTime = process.hrtime.bigint();
      const navigationDurationMs = Number(navigationEndTime - navigationStartTime) / 1_000_000;
      this.logger.info(`Successfully loaded Holyrics page in ${navigationDurationMs.toFixed(2)}ms`, {
        url: this.holyrics.URL,
      });

      this.notifier.setStatus({
        subject: 'holyrics',
        items: {
          active: true,
        },
        logs: [
          {
            message: `Successfully loaded Holyrics page in ${navigationDurationMs.toFixed(2)}ms`,
            context: {
              url: this.holyrics.URL,
              openPages: (await this.browser?.pages())?.length || 0,
            },
          },
        ],
      });

      this.isConnecting = false;
      this.networkFailureCount = 0;
      return true;
    } catch (error) {
      const errorMessage = (error as Error).message.split('\n')[0];

      const executablePathMatch = errorMessage.match(/executablePath \((.*?)\)/);
      const executablePath = executablePathMatch ? executablePathMatch[1] : undefined;

      this.logger.error('Failed to connect to Holyrics', {
        error: errorMessage,
        executablePath,
      });

      this.notifier.setStatus({
        subject: 'holyrics',
        items: {
          active: false,
        },
        logs: [
          {
            message: 'Failed to connect to Holyrics',
            context: {
              executablePath,
              url: this.holyrics.URL,
              errorMessage,
            },
          },
        ],
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
    if (this.isReconnecting) {
      return;
    }

    this.isReconnecting = true;
    try {
      this.networkFailureCount = 0; // Reset network failure count on reconnection attempt
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
    } finally {
      this.isReconnecting = false;
    }
  };

  private handleRequestFailed = (request: HTTPRequest) => {
    const failure = request.failure();

    if (
      failure &&
      (failure.errorText === 'net::ERR_CONNECTION_REFUSED' || failure.errorText === 'canceled') &&
      request.url().includes(this.holyrics.URL) // Only track failures for the Holyrics domain
    ) {
      this.networkFailureCount++;

      if (this.networkFailureCount === 1) {
        this.notifier.setStatus({
          subject: 'holyrics',
          items: {
            active: false,
          },
          logs: [
            {
              message: 'Holyrics is unreachable',
              context: {
                url: this.holyrics.URL,
                failureCount: this.networkFailureCount,
                // pages: (await this.browser?.pages())?.length || 0,
              },
            },
          ],
        });
      }
      this.logger.warn(`Network request failed: ${request.url()} - ${failure.errorText}`, {
        currentFailures: this.networkFailureCount,
      });

      if (this.networkFailureCount >= this.holyrics.MAX_NETWORK_FAILURES) {
        this.logger.error(
          `Max network failures (${this.holyrics.MAX_NETWORK_FAILURES}) reached. Triggering reconnection.`,
        );
        this.handleReconnection();
      }
    }
  };

  private startPollling = async ({ callback }: MonitorBibleOutputParams): Promise<void> => {
    this.intervalId = setInterval(async () => {
      // If a reconnection is in progress due to network issues, do not proceed with polling
      if (!this.page || this.isConnecting) {
        return;
      }

      // Check if the page is closed or crashed
      // Puppeteer doesn't expose isCrashed directly, but we can check if the browser is still connected
      const browserConnected = this.browser?.connected;
      if (!browserConnected || this.page.isClosed()) {
        this.logger.error('Page or browser is disconnected/crashed. Attempting reconnection');

        this.notifier.setStatus({
          subject: 'holyrics',
          items: {
            active: false,
          },
          logs: [
            {
              message: 'Page or browser is disconnected/crashed. Attempting reconnection',
            },
          ],
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

        if (this.networkFailureCount > 0 || this.isConnecting) {
          if (!this.previousBibleVerse) return;

          this.previousBibleVerse = undefined;
          return callback(undefined);
        }

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

        this.notifier.setStatus({
          subject: 'holyrics',
          items: {
            active: false,
          },
          logs: [
            {
              message: 'Failed to read DOM during polling',
              context: {
                errorMessage,
              },
            },
          ],
        });

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

    this.notifier.setStatus({
      subject: 'holyrics',
      items: {
        active: true,
      },
    });

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
      const currentPage = this.page; // Capture reference to current page
      // Detach listeners before potentially closing and nullifying the page
      if (this.boundHandleRequest) {
        currentPage.off('request', this.boundHandleRequest);
        this.boundHandleRequest = undefined;
      }
      if (this.boundHandleRequestFailed) {
        currentPage.off('requestfailed', this.boundHandleRequestFailed);
        this.boundHandleRequestFailed = undefined;
      }

      try {
        await currentPage.close();
      } catch (error) {
        this.logger.error('Failed to close page', { error: (error as Error).message });
      } finally {
        this.page = undefined;
      }
    }
    if (this.browser) {
      try {
        await this.browser.close();

        this.notifier.setStatus({
          subject: 'holyrics',
          items: {
            active: false,
          },
        });
      } catch (error) {
        this.logger.error('Failed to close browser', { error: (error as Error).message });
      } finally {
        this.browser = undefined;
      }
    }
    this.isConnecting = false;
    this.isReconnecting = false; // Reset on destroy
    this.previousBibleVerse = undefined;
    this.networkFailureCount = 0; // Reset on destroy
  };
}
