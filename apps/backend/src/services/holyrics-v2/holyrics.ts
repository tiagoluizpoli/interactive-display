import type { HolyricsServiceConfig, StatusNotifier, BibleVerse } from './types';
import { createChildLogger } from '@/config/logger';
import { BrowserManager } from './browser-manager';
import type { HTTPRequest } from 'puppeteer';
import { delay } from '@/utils';

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
  private isConnecting = false;
  private isReconnecting = false;
  private networkFailureCount = 0;
  private boundHandleRequestFailed?: (request: HTTPRequest) => void;

  constructor(
    private readonly config: HolyricsServiceConfig,
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

  /**
   * @method connectToHolyrics
   * @description Attempts to establish a connection to the Holyrics web interface using the BrowserManager.
   * This method ensures that the browser and page are launched and navigated to the target URL.
   * It handles connection errors by closing the browser for cleanup and returning a failure status.
   * @returns {Promise<boolean>} A promise that resolves to `true` if the connection is successful, `false` otherwise.
   */
  private connectToHolyrics = async (): Promise<boolean> => {
    if (this.isConnecting) return false;

    this.isConnecting = true;
    try {
      this.logger.info('Attempting to connect to Holyrics page.');
      await this.browserManager.launch(); // Ensures a fresh browser/page

      this.browserManager.manageListeners(async (page) => {
        if (this.boundHandleRequestFailed) {
          page.off('requestfailed', this.boundHandleRequestFailed);
        }
        this.boundHandleRequestFailed = this.handleRequestFailed.bind(this);
        page.on('requestfailed', this.boundHandleRequestFailed);
        await page.setRequestInterception(true);
        page.on('request', (request) => request.continue());

        this.logger.debug('Puppeteer request interception enabled and listeners attached.');
      });

      const navigationStartTime = process.hrtime.bigint();
      await this.browserManager.navigate(this.config.URL);
      const navigationEndTime = process.hrtime.bigint();
      const navigationDurationMs = Number(navigationEndTime - navigationStartTime) / 1_000_000;

      this.logger.info(`Successfully loaded Holyrics page in ${navigationDurationMs.toFixed(2)}ms`, {
        url: this.config.URL,
      });

      this.notifier.setStatus({
        subject: 'holyrics',
        items: { active: true },
        logs: [
          {
            message: `Successfully loaded Holyrics page in ${navigationDurationMs.toFixed(2)}ms`,
            context: {
              url: this.config.URL,
              openPages: await this.browserManager.getOpenPagesCount(),
            },
          },
        ],
      });

      this.networkFailureCount = 0; // Reset network failure count on success
      return true;
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

      await this.browserManager.close(); // Close browser on connection failure
      return false;
    } finally {
      this.isConnecting = false;
    }
  };

  /**
   * @method handleReconnection
   * @description Manages the entire reconnection process.
   * This method ensures only one reconnection attempt is active at a time.
   * It gracefully closes any existing browser, then repeatedly attempts to connect
   * until successful, introducing delays between attempts.
   * @returns {Promise<void>}
   */
  private handleReconnection = async (): Promise<void> => {
    if (this.isReconnecting) {
      this.logger.debug('Reconnection already in progress. Skipping new attempt.');
      return;
    }

    this.isReconnecting = true;
    try {
      this.networkFailureCount = 0; // Reset network failure count at the start of a new reconnection sequence.
      this.logger.info('Initiating full reconnection sequence. Closing existing browser.');
      await this.browserManager.close(); // Ensure previous browser is fully purged

      let attempt = 1;
      while (!(await this.connectToHolyrics())) {
        this.logger.warn(`Reconnection attempt ${attempt} failed. Retrying in ${this.config.RETRY_TIME} seconds.`);
        this.notifier.setStatus({
          subject: 'holyrics',
          items: { active: false },
          logs: [
            {
              message: `Reconnection attempt ${attempt} failed. Retrying...`,
              context: {
                retryTimeSeconds: this.config.RETRY_TIME,
              },
            },
          ],
        });
        await delay(this.config.RETRY_TIME * 1000); // Wait for the configured retry time
        attempt++;
      }
      this.logger.info('Reconnection successful.');
      this.notifier.setStatus({
        subject: 'holyrics',
        items: { active: true },
        logs: [
          {
            message: 'Holyrics reconnected successfully.',
          },
        ],
      });
    } finally {
      this.isReconnecting = false;
    }
  };

  private handleRequestFailed = (request: HTTPRequest) => {
    const failure = request.failure();

    if (
      failure &&
      (failure.errorText === 'net::ERR_CONNECTION_REFUSED' || failure.errorText === 'canceled') &&
      request.url().includes(this.config.URL) &&
      this.browserManager.isPageOpen()
    ) {
      this.networkFailureCount++;
      this.logger.warn(`Network request failed: ${request.url()} - ${failure.errorText}`, {
        currentFailures: this.networkFailureCount,
        maxFailures: this.config.MAX_NETWORK_FAILURES,
      });

      if (this.networkFailureCount === 1) {
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
      }

      if (this.networkFailureCount >= this.config.MAX_NETWORK_FAILURES) {
        this.logger.error(
          `Max network failures (${this.config.MAX_NETWORK_FAILURES}) reached. Triggering reconnection.`,
        );
        this.handleReconnection();
      }
    }
  };

  /**
   * @method startPolling
   * @description Initiates a continuous polling mechanism to scrape Bible verse data from the Holyrics page.
   * This method uses `setInterval` to periodically execute logic for DOM scraping and health checks.
   * It prevents polling if the page is not available or if a connection attempt is in progress.
   * If the page or browser is disconnected/crashed, it triggers a full reconnection.
   * @param {MonitorBibleOutputParams} { callback } - A callback function to be invoked with updated Bible verses.
   * @returns {Promise<void>}
   */
  private startPolling = async ({
    callback,
  }: { callback: (bibleVerse: BibleVerse | undefined) => void }): Promise<void> => {
    this.intervalId = setInterval(async () => {
      if (this.isConnecting || this.isReconnecting) {
        this.logger.debug('Polling skipped: page/browser not ready or connection/reconnection in progress.', {
          isConnecting: this.isConnecting,
          isReconnecting: this.isReconnecting,
        });
        return;
      }

      if (!this.browserManager.isBrowserConnected() || !this.browserManager.isPageOpen()) {
        this.logger.error('Page or browser is disconnected/crashed. Attempting reconnection.');
        this.notifier.setStatus({
          subject: 'holyrics',
          items: { active: false },
          logs: [
            {
              message: 'Page or browser is disconnected/crashed. Attempting reconnection.',
            },
          ],
        });
        await this.handleReconnection();
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

          if (this.networkFailureCount > 0 || this.isConnecting) {
            if (this.previousBibleVerse) {
              this.previousBibleVerse = undefined;
              callback(undefined);
              this.logger.info('Cleared previous Bible verse due to network issues or ongoing connection.');
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
          const errorMessage = (error as Error).message.split('\n')[0];
          this.logger.error('Failed to read DOM during polling', { error: errorMessage });

          this.notifier.setStatus({
            subject: 'holyrics',
            items: { active: false },
            logs: [
              {
                message: 'Failed to read DOM during polling. Attempting reconnection.',
                context: { errorMessage },
              },
            ],
          });

          if (!this.isConnecting && !this.isReconnecting) {
            this.logger.warn('DOM reading failed. Triggering reconnection to get a fresh page.');
            await this.handleReconnection();
          }
        }
      });
    }, this.config.POLLING_INTERVAL_MS);
  };

  /**
   * @method monitorBibleOutput
   * @description The main public method to start monitoring Holyrics for Bible verse updates.
   * It initiates a robust connection, starts polling, and registers a SIGINT handler for graceful shutdown.
   * @param {{ callback: (bibleVerse: BibleVerse | undefined) => void }} params - An object containing the `callback` function.
   * @returns {Promise<void>}
   */
  public monitorBibleOutput = async (params: {
    callback: (bibleVerse: BibleVerse | undefined) => void;
  }): Promise<void> => {
    this.logger.info('Starting Holyrics monitoring (V2)');

    // Ensure a connection is established or re-established before starting to poll.
    await this.handleReconnection();

    // Begin the continuous polling for Bible verse updates.
    this.startPolling(params);

    this.logger.info('Holyrics monitoring (V2) started.');

    // Update the system status to indicate that Holyrics monitoring is active.
    this.notifier.setStatus({
      subject: 'holyrics',
      items: { active: true },
    });

    // Register a listener for the process's SIGINT signal for graceful shutdown.
    process.on('SIGINT', async () => {
      await this.destroy();
      process.exit(0); // Exit after cleanup
    });
  };

  /**
   * @method destroy
   * @description Performs a comprehensive cleanup of all resources managed by the `Holyrics` instance.
   * This includes clearing the polling interval and gracefully closing the browser via `BrowserManager`.
   * @returns {Promise<void>}
   */
  public destroy = async (): Promise<void> => {
    this.logger.info('Cleaning up Holyrics (V2) resources.');

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      this.logger.debug('Polling interval cleared.');
    }
    if (this.boundHandleRequestFailed) {
      this.browserManager.manageListeners(async (page) => {
        page.off('requestfailed', this.boundHandleRequestFailed);
        this.boundHandleRequestFailed = undefined;
        this.logger.debug('Detached requestfailed listener.');
      });
    }

    await this.browserManager.close();

    this.isConnecting = false;
    this.isReconnecting = false;
    this.previousBibleVerse = undefined;
    this.networkFailureCount = 0;

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
}
