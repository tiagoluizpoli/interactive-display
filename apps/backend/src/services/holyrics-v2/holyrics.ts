import type { HolyricsServiceConfig, StatusNotifier, BibleVerse } from './types';
import { createChildLogger } from '@/config/logger';
import { BrowserManager } from './browser-manager';
import type { HTTPRequest } from 'puppeteer';
import { MAX_DOM_READ_FAILURES } from './constants';

const connectionStateOptions = ['STOPPED', 'DISCONNECTED', 'CONNECTING', 'CONNECTED'] as const;
type ConnectionState = (typeof connectionStateOptions)[number];

/**
 * @class Holyrics
 * @description The core class for integrating with Holyrics to monitor and extract Bible verses (V2).
 * It uses a dedicated BrowserManager to handle Puppeteer interactions, ensuring robust
 * browser/page lifecycle management, efficient resource usage, and resilient reconnection logic.
 */
export class Holyrics {
  private readonly browserManager: BrowserManager;
  private readonly logger;
  private previousBibleVerse?: BibleVerse;
  private intervalId?: NodeJS.Timeout;
  private connectionState: ConnectionState = 'DISCONNECTED';
  private networkFailureCount = 0;
  private domReadFailureCount = 0; // New property for tracking consecutive DOM read failures
  private boundHandleRequestFailed?: (request: HTTPRequest) => void;
  private boundSigIntHandler?: () => Promise<void>;

  constructor(
    private config: HolyricsServiceConfig, // Made non-readonly to allow updateConfig
    private readonly notifier: StatusNotifier,
  ) {
    this.logger = createChildLogger('Holyrics');
    this.browserManager = new BrowserManager({
      headless: true, // Always headless for server environments
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--no-zygote',
        '--single-process',
      ],
      defaultNavigationTimeoutMs: config.TIMEOUT * 1000,
      loggerName: 'Holyrics:BrowserManager',
    });
  }

  private setConnectionState(newState: ConnectionState) {
    if (this.connectionState === newState) return;

    this.logger.debug(`Connection state transition: ${this.connectionState} -> ${newState}`);
    this.connectionState = newState;
  }

  private connectToHolyricsV2 = async (): Promise<void> => {
    this.setConnectionState('CONNECTING');
    try {
      this.logger.info('Attempting to connect to Holyrics Page');
      await this.browserManager.launch();

      await this.browserManager.navigate(this.config.URL);

      this.browserManager.manageListeners(async (page) => {
        this.boundHandleRequestFailed = this.handleRequestFailed.bind(this);
        page.on('requestfailed', this.boundHandleRequestFailed);
        await page.setRequestInterception(true);

        page.on('request', (request) => {
          request.continue();
        });

        page.on('response', (resp) => {
          if (resp.status() === 200) {
            this.notifier.setStatus({
              subject: 'holyrics',
              items: { active: true },
              logs: this.networkFailureCount > 0 ? [{ message: 'Connection restored' }] : [],
            });

            this.networkFailureCount = 0;
          }
        });

        this.logger.debug('Puppeteer request interception enabled and listeners attached.');
      });
      this.setConnectionState('CONNECTED');
      this.networkFailureCount = 0;
      this.logger.info('Successfully loaded Holyrics page', {
        url: this.config.URL,
      });

      this.notifier.setStatus({
        subject: 'holyrics',
        items: { active: true },
        logs: [
          {
            message: 'Successfully loaded Holyrics page',
            context: {
              url: this.config.URL,
              openPages: await this.browserManager.getOpenPagesCount(),
            },
          },
        ],
      });
    } catch (error) {
      const errorMessage = (error as Error).message.split('\n')[0];
      this.logger.error('Failed to connect to Holyrics', {
        error: errorMessage,
        url: this.config.URL,
      });

      this.notifier.setStatus({
        subject: 'holyrics',
        items: { active: false },
        logs: [
          {
            message: 'Failed to connect to Holyrics',
            context: {
              url: this.config.URL,
              errorMessage,
            },
          },
        ],
      });
      this.disconnect();
    }
  };

  private disconnect(): void {
    this.setConnectionState('DISCONNECTED');

    if (this.boundHandleRequestFailed) {
      // BrowserManager.close() should handle page listener cleanup.
      // We just clear our internal reference.
      this.boundHandleRequestFailed = undefined;

      this.logger.debug('Cleared boundHandleRequestFailed reference.');
    }
  }

  private handleConnectionV2 = async (): Promise<void> => {
    const intervalId = setInterval(() => {
      if (this.connectionState === 'STOPPED') {
        clearInterval(intervalId);
      }

      if (this.connectionState === 'CONNECTED') {
        return;
      }

      if (this.connectionState === 'CONNECTING') {
        this.logger.debug('Connection already in progress. Skipping new attempt.');
        return;
      }

      this.connectToHolyricsV2();
    }, 3 * 1000);
  };

  private handleRequestFailed = async (request: HTTPRequest) => {
    const failure = request.failure();

    if (
      failure &&
      (failure.errorText.includes('ERR_CONNECTION_REFUSED') || failure.errorText.includes('canceled')) &&
      request.url().includes(this.config.URL) &&
      this.browserManager.isPageOpen()
    ) {
      this.networkFailureCount++;
      this.logger.warn(`Network request failed: ${request.url()} - ${failure.errorText}`, {
        currentFailures: this.networkFailureCount,
        maxFailures: this.config.MAX_NETWORK_FAILURES,
      });

      this.notifier.setStatus({
        subject: 'holyrics',
        items: { active: false },
        logs: [
          {
            message: 'Holyrics connection issue detected. Attempting to recover...',
            context: {
              url: this.config.URL,
              failureCount: this.networkFailureCount,
            },
          },
        ],
      });

      if (this.networkFailureCount >= this.config.MAX_NETWORK_FAILURES) {
        this.logger.error(
          `Max network failures (${this.config.MAX_NETWORK_FAILURES}) reached. Triggering reconnection.`,
        );
        this.networkFailureCount = 0;
        this.disconnect();
      }
    }
  };

  private startPolling = async ({
    callback,
  }: { callback: (bibleVerse: BibleVerse | undefined) => void }): Promise<void> => {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.logger.debug('Previous polling interval cleared before setting a new one.');
    }

    this.intervalId = setInterval(async () => {
      if (this.connectionState !== 'CONNECTED' || this.networkFailureCount > 0) {
        this.previousBibleVerse = undefined;
        callback(undefined);
        this.logger.info('Cleared previous Bible verse due to network issues or non-CONNECTED state.');

        this.logger.debug('Polling skipped: not in CONNECTED state.', {
          connectionState: this.connectionState,
        });
        return;
      }

      this.browserManager.evaluate(async (page) => {
        try {
          const currentBibleVerse = await page.evaluate(
            (referenceSelector: string, textSelector: string, versionSelector: string) => {
              const referenceHtmlObject = document.querySelector(referenceSelector);
              const textHtmlObject = document.querySelector(textSelector);
              const versionHtmlObject = document.querySelector(versionSelector);

              const reference = referenceHtmlObject?.textContent?.trim().replace(/\s\s+/g, ' ');
              const text = textHtmlObject?.textContent?.trim().replace(/\s\s+/g, ' ');
              const version = versionHtmlObject?.textContent?.trim().replace(/\s\s+/g, ' ');

              if (
                !reference ||
                !text ||
                !version ||
                typeof reference !== 'string' ||
                typeof text !== 'string' ||
                typeof version !== 'string'
              ) {
                return undefined;
              }

              return { reference, text, version };
            },
            this.config.REFERENCE_SELECTOR,
            this.config.TEXT_SELECTOR,
            this.config.VERSION_SELECTOR,
          );

          if (currentBibleVerse) {
            this.domReadFailureCount = 0; // Reset DOM read failure count on successful read
          }

          if (this.connectionState !== 'CONNECTED') {
            if (this.previousBibleVerse) {
              this.previousBibleVerse = undefined;
              callback(undefined);
              this.logger.info('Cleared previous Bible verse due to network issues or non-CONNECTED state.');
            }
            return;
          }

          if (this.previousBibleVerse && !currentBibleVerse) {
            this.previousBibleVerse = undefined;
            callback(undefined);
            this.logger.info('Bible verse disappeared from display.');
            return;
          }

          if (
            this.previousBibleVerse &&
            currentBibleVerse &&
            this.previousBibleVerse.reference === currentBibleVerse.reference
          ) {
            return; // No change, do nothing
          }

          if (!currentBibleVerse) return; // No current verse and not a disappearing case

          this.previousBibleVerse = currentBibleVerse;
          callback(currentBibleVerse);
          this.logger.debug('New Bible verse detected and callback invoked.', { verse: currentBibleVerse.reference });
        } catch (error) {
          this.domReadFailureCount++; // Increment on DOM read failure
          const errorMessage = (error as Error).message.split('\n')[0];
          this.logger.error('Failed to read DOM during polling', {
            error: errorMessage,
            currentFailures: this.domReadFailureCount,
            maxFailures: MAX_DOM_READ_FAILURES,
          });

          this.notifier.setStatus({
            subject: 'holyrics',
            items: { active: false },
            logs: [
              {
                message: 'Failed to read DOM during polling. Attempting recovery.',
                context: { errorMessage, currentDomReadFailures: this.domReadFailureCount },
              },
            ],
          });

          // Trigger full reconnection only if DOM read failures exceed threshold and not already reconnecting
          if (this.domReadFailureCount >= MAX_DOM_READ_FAILURES) {
            this.logger.warn(`Max DOM read failures (${MAX_DOM_READ_FAILURES}) reached. Triggering full reconnection.`);
            this.disconnect();
          }
        }
      });
    }, this.config.POLLING_INTERVAL_MS);
  };

  public monitorBibleOutput = async (params: {
    callback: (bibleVerse: BibleVerse | undefined) => void;
  }): Promise<void> => {
    this.logger.info('Starting Holyrics monitoring (V2)');

    await this.handleConnectionV2();

    this.startPolling(params);

    this.logger.info('Holyrics monitoring (V2) started.');

    // Register a listener for the process's SIGINT signal for graceful shutdown, only if not already registered.
    if (!this.boundSigIntHandler) {
      this.boundSigIntHandler = async () => {
        await this.destroy();
        process.exit(0); // Exit after cleanup
      };
      process.on('SIGINT', this.boundSigIntHandler);
    }
  };

  public destroy = async (): Promise<void> => {
    this.logger.info('Cleaning up Holyrics (V2) resources.');

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      this.logger.debug('Polling interval cleared.');
    }

    if (this.boundHandleRequestFailed) {
      // BrowserManager.close() should handle page listener cleanup.
      // We just clear our internal reference.
      this.boundHandleRequestFailed = undefined;
      this.logger.debug('Cleared boundHandleRequestFailed reference.');
    }

    if (this.boundSigIntHandler) {
      process.off('SIGINT', this.boundSigIntHandler);
      this.boundSigIntHandler = undefined;
      this.logger.debug('Detached SIGINT listener.');
    }

    await this.browserManager.close();

    this.setConnectionState('STOPPED');
    this.previousBibleVerse = undefined;
    this.networkFailureCount = 0;
    this.domReadFailureCount = 0; // Reset DOM read failure count on destroy

    this.notifier.setStatus({
      subject: 'holyrics',
      items: { active: false },
      logs: [
        {
          message: 'Holyrics monitoring stopped and resources cleaned up.',
        },
      ],
    });
    this.logger.info('Holyrics (V2) resources cleaned up successfully.');
  };

  public updateConfig(newConfig: HolyricsServiceConfig): void {
    Object.assign(this.config, newConfig);
    this.logger.debug('Holyrics configuration updated.', { newConfig });
  }
}
