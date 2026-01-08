/**
 * @file This file contains the HolyricsBible class, which is responsible for interacting with the Holyrics
 * web interface using Puppeteer to extract Bible verses and monitor changes.
 *
 * This class orchestrates browser automation, connection management, robust error handling,
 * and periodic polling to provide real-time updates of Bible verses displayed on the Holyrics platform.
 * It's designed to be resilient to network issues and browser crashes, attempting automatic reconnections.
 */

import type { HolyricsConfig, StatusNotifier } from '@/config';
import puppeteer, { type Browser, type Page, type HTTPRequest } from 'puppeteer';
import { createChildLogger } from '../config/logger';
import { delay } from '@/utils';

/**
 * @interface BibleVerse
 * @description Defines the structure for a single Bible verse.
 * It includes the `reference` (e.g., "John 3:16"), the `text` of the verse, and the `version` (e.g., "NIV").
 */
export interface BibleVerse {
  reference: string; // The canonical reference of the Bible verse (e.g., "John 3:16").
  text: string; // The actual text content of the Bible verse.
  version: string; // The Bible version from which the verse was extracted (e.g., "NVI", "KJV").
}

/**
 * @interface MonitorBibleOutputParams
 * @description Specifies the parameters required for the `monitorBibleOutput` method.
 * Primarily, it includes a `callback` function that will be invoked with updated Bible verses.
 */
interface MonitorBibleOutputParams {
  callback: (bibleVerse: BibleVerse | undefined) => void; // A function to be called when a new Bible verse is detected or when it disappears.
}

/**
 * @class HolyricsBible
 * @description The core class for integrating with Holyrics to monitor and extract Bible verses.
 * It uses Puppeteer to control a headless browser, navigate to the Holyrics display URL,
 * and periodically scrape the DOM for Bible verse updates. It also implements sophisticated
 * reconnection logic to handle network failures, browser crashes, and page disconnections,
 * ensuring continuous operation.
 */
export class HolyricsBible {
  private browser?: Browser; // Holds the Puppeteer browser instance. It is `undefined` initially or after being closed.
  private page?: Page; // Holds the Puppeteer page instance within the browser. It is `undefined` initially or after being closed.
  private previousBibleVerse?: BibleVerse; // Stores the last successfully extracted Bible verse. Used to detect changes and avoid redundant callbacks.
  private intervalId?: NodeJS.Timeout; // Stores the ID of the `setInterval` used for polling, allowing it to be cleared during cleanup.
  private readonly logger = createChildLogger('HolyricsBible'); // A dedicated logger instance for this class, facilitating targeted logging and debugging.
  private isConnecting = false; // A boolean flag indicating if a browser connection attempt is currently in progress. Prevents multiple simultaneous connection calls.
  private isReconnecting = false; // A boolean flag indicating if a full reconnection sequence (including browser close/launch) is in progress. Prevents parallel reconnection efforts.
  private networkFailureCount = 0; // Counts consecutive network request failures. If it exceeds a threshold, a full reconnection is triggered.
  private boundHandleRequest?: (request: HTTPRequest) => void; // A bound reference to the `handleRequest` method, used for Puppeteer event listeners.
  private boundHandleRequestFailed?: (request: HTTPRequest) => void; // A bound reference to the `handleRequestFailed` method, used for Puppeteer event listeners.

  /**
   * @constructor
   * @param {HolyricsConfig} holyrics - The configuration object containing Holyrics-specific settings such as URL, timeouts, polling intervals, and CSS selectors for Bible verse elements.
   * @param {StatusNotifier} notifier - An instance of `StatusNotifier` used to update the overall application's status regarding the Holyrics connection and to log important events.
   */
  constructor(
    private readonly holyrics: HolyricsConfig,
    private readonly notifier: StatusNotifier,
  ) {}

  /**
   * @method launchBrowser
   * @description Asynchronously launches a new Puppeteer browser instance.
   * This method is responsible for configuring the browser for headless operation,
   * setting the executable path (useful for Docker environments), and applying
   * various command-line arguments to improve compatibility, performance, and resource usage.
   * After launching, it creates a new page within the browser and assigns it to `this.page`.
   * @returns {Promise<void>}
   */
  private launchBrowser = async () => {
    // Launch Puppeteer in headless mode, meaning no visible browser UI.
    // `executablePath` can be overridden by an environment variable, useful for CI/CD or specific environments like Docker.
    // `args` array contains various flags to optimize Puppeteer for server environments and reduce resource consumption.
    this.browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome',
      args: [
        '--no-sandbox', // Required for running Puppeteer in Docker without root privileges.
        '--disable-setuid-sandbox', // Disables the setuid sandbox, also for security/permissions in containers.
        '--disable-gpu', // Disables GPU hardware acceleration, suitable for headless environments.
        '--disable-dev-shm-usage', // Overcomes limited `/dev/shm` space in some Docker setups, using `/tmp` instead.
        '--no-zygote', // Disables the zygote process, potentially reducing memory footprint.
        '--single-process', // Forces the browser to run in a single process, which can simplify debugging and resource management.
      ],
    });

    // Create a new browser page and assign it to the instance variable.
    this.page = await this.browser.newPage();
  };

  /**
   * @method connectToHolyrics
   * @description Attempts to establish or re-establish a connection to the Holyrics web interface.
   * This method performs the following steps:
   * 1. Checks `isConnecting` to prevent concurrent connection attempts.
   * 2. Launches a new browser if `this.browser` is not already initialized.
   * 3. Clears any existing Puppeteer event listeners to prevent memory leaks and ensure fresh state.
   * 4. Enables request interception on the page to monitor network activity.
   * 5. Binds and attaches a `requestfailed` listener (`handleRequestFailed`) to detect network errors.
   * 6. Configures a general `request` listener to allow all other requests to continue.
   * 7. Navigates the Puppeteer page to the configured Holyrics URL (`this.holyrics.URL`),
   *    waiting for the DOM to be loaded and respecting a configured timeout.
   * 8. Logs navigation duration and updates the application's status to `active` if successful.
   * 9. Resets `networkFailureCount` on successful connection.
   * 10. Catches any errors during the connection process, logs them, updates the status to `inactive`,
   *     and closes the browser for cleanup, returning `false` to indicate failure.
   * @returns {Promise<boolean>} A promise that resolves to `true` if the connection is successful, `false` otherwise.
   */
  private connectToHolyrics = async () => {
    // Prevent multiple connection attempts from running simultaneously.
    if (this.isConnecting) return false;

    this.isConnecting = true; // Set flag to indicate connection in progress.

    try {
      // If no browser instance exists, launch one.
      if (!this.browser) {
        await this.launchBrowser();
      }

      // Important: Remove any old listeners before attaching new ones to prevent memory leaks,
      // especially during reconnections where the `page` object might be reused or replaced.
      if (this.page) {
        if (this.boundHandleRequest) {
          this.page.off('request', this.boundHandleRequest);
        }
        if (this.boundHandleRequestFailed) {
          this.page.off('requestfailed', this.boundHandleRequestFailed);
        }
      }

      // Enable request interception to allow control over network requests (e.g., to listen for failures).
      await this.page!.setRequestInterception(true);

      // Bind `handleRequestFailed` to the current instance and attach it as a listener for 'requestfailed' events.
      this.boundHandleRequestFailed = this.handleRequestFailed.bind(this);
      this.page!.on('requestfailed', this.boundHandleRequestFailed);

      // Configure a listener to allow all other requests to continue without blocking them.
      this.boundHandleRequest = async (request: HTTPRequest) => {
        request.continue();
      };
      this.page!.on('request', this.boundHandleRequest);

      this.logger.info('Puppeteer request interception enabled.');

      this.logger.debug(`Navigating to Holyrics URL: ${this.holyrics.URL}`);
      const navigationStartTime = process.hrtime.bigint(); // Record start time for navigation performance.

      // Navigate to the Holyrics URL.
      // `waitUntil: 'domcontentloaded'` waits until the initial HTML document has been completely loaded and parsed.
      // `timeout` is configurable via `this.holyrics.TIMEOUT`.
      await this.page!.goto(this.holyrics.URL, {
        waitUntil: 'domcontentloaded',
        timeout: this.holyrics.TIMEOUT * 1000, // Convert seconds to milliseconds.
      });

      const navigationEndTime = process.hrtime.bigint(); // Record end time.
      const navigationDurationMs = Number(navigationEndTime - navigationStartTime) / 1_000_000; // Calculate duration in ms.
      this.logger.info(`Successfully loaded Holyrics page in ${navigationDurationMs.toFixed(2)}ms`, {
        url: this.holyrics.URL,
      });

      // Update the application status to active and include relevant logs.
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
              openPages: (await this.browser?.pages())?.length || 0, // Number of open pages in the browser.
            },
          },
        ],
      });

      this.isConnecting = false; // Reset connection flag.
      this.networkFailureCount = 0; // Reset network failure count on success.
      return true; // Indicate successful connection.
    } catch (error) {
      const errorMessage = (error as Error).message.split('\n')[0]; // Extract the first line of the error message for conciseness.

      // Attempt to extract the executable path from the error message for better debugging.
      const executablePathMatch = errorMessage.match(/executablePath \((.*?)\)/);
      const executablePath = executablePathMatch ? executablePathMatch[1] : undefined;

      this.logger.error('Failed to connect to Holyrics', {
        error: errorMessage,
        executablePath,
      });

      // Update the application status to inactive due to connection failure.
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

      // If a browser instance exists, close it to clean up resources after a failed connection.
      if (this.browser) {
        this.logger.warn('Closing browser for cleanup due to connection error');
        await this.browser.close();
        this.browser = undefined; // Clear browser reference.
        this.page = undefined; // Clear page reference.
      }

      this.isConnecting = false; // Reset connection flag.
      return false; // Indicate failed connection.
    } finally {
      this.isConnecting = false; // Ensure `isConnecting` is always reset, even if an unexpected error occurs.
    }
  };

  /**
   * @method handleReconnection
   * @description Manages the entire reconnection process.
   * This method is called when a significant issue occurs (e.g., maximum network failures reached,
   * browser/page crash). It ensures that:
   * 1. Only one reconnection attempt is active at a time (`isReconnecting` flag).
   * 2. Any existing browser instance is gracefully closed and cleaned up.
   * 3. It enters a loop, repeatedly attempting to call `connectToHolyrics` until a successful connection
   *    is established. Between failed attempts, it introduces a delay (`this.holyrics.RETRY_TIME`)
   *    to prevent overwhelming the system or target server.
   * 4. Resets the `networkFailureCount` at the beginning of each new reconnection attempt.
   * @returns {Promise<void>}
   */
  private handleReconnection = async (): Promise<void> => {
    // If a reconnection is already in progress, exit to prevent redundant or conflicting attempts.
    if (this.isReconnecting) {
      return;
    }

    this.isReconnecting = true; // Set flag to indicate reconnection in progress.
    try {
      this.networkFailureCount = 0; // Reset network failure count at the start of a new reconnection sequence.
      if (this.browser) {
        this.logger.info('Closing existing browser for reconnection');
        await this.browser.close(); // Close the existing browser to ensure a clean slate.
        this.browser = undefined; // Clear browser reference.
        this.page = undefined; // Clear page reference.
      }

      // Continuously attempt to connect until `connectToHolyrics` returns `true` (success).
      while (!(await this.connectToHolyrics())) {
        this.logger.warn('Reconnection attempt failed', { retryTimeSeconds: this.holyrics.RETRY_TIME });
        await delay(this.holyrics.RETRY_TIME * 1000); // Wait for the configured retry time before the next attempt.
      }
    } finally {
      this.isReconnecting = false; // Ensure `isReconnecting` is always reset upon completion or error.
    }
  };

  /**
   * @method handleRequestFailed
   * @description A Puppeteer event listener for 'requestfailed' events.
   * This method is triggered whenever a network request initiated by the browser page fails.
   * Its primary purpose is to:
   * 1. Identify critical network errors like `net::ERR_CONNECTION_REFUSED` or `canceled`
   *    that indicate a complete loss of connection to the Holyrics server.
   * 2. Only track failures for requests made to the configured `this.holyrics.URL` to avoid reacting
   *    to failures from unrelated third-party resources.
   * 3. Increment `this.networkFailureCount` for relevant failures.
   * 4. If `networkFailureCount` reaches `this.holyrics.MAX_NETWORK_FAILURES`, it considers
   *    the Holyrics platform unreachable and triggers a full reconnection via `handleReconnection`.
   * 5. Updates the application status via the `notifier` service to reflect the network state.
   * @param {HTTPRequest} request - The Puppeteer `HTTPRequest` object representing the failed request, containing details about the failure.
   * @returns {void}
   */
  private handleRequestFailed = (request: HTTPRequest) => {
    const failure = request.failure(); // Get the failure details from the request.

    // Check if there's a failure and if it's one of the critical network errors,
    // and ensure the failed request URL belongs to the Holyrics domain.
    if (
      failure &&
      (failure.errorText === 'net::ERR_CONNECTION_REFUSED' || failure.errorText === 'canceled') &&
      request.url().includes(this.holyrics.URL)
    ) {
      this.networkFailureCount++; // Increment the counter for consecutive network failures.

      // If this is the *first* network failure in a sequence, update the status notifier.
      // This avoids spamming the notifier for every single failed request in a burst.
      if (this.networkFailureCount === 1) {
        this.notifier.setStatus({
          subject: 'holyrics',
          items: {
            active: false, // Mark Holyrics as inactive.
          },
          logs: [
            {
              message: 'Holyrics is unreachable', // Clear message indicating the problem.
              context: {
                url: this.holyrics.URL,
                failureCount: this.networkFailureCount,
                // pages: (await this.browser?.pages())?.length || 0, // Commented out, but could be useful context.
              },
            },
          ],
        });
      }
      this.logger.warn(`Network request failed: ${request.url()} - ${failure.errorText}`, {
        currentFailures: this.networkFailureCount, // Log the current failure count for context.
      });

      // If the number of consecutive network failures meets or exceeds the configured maximum,
      // trigger a full reconnection to attempt recovery.
      if (this.networkFailureCount >= this.holyrics.MAX_NETWORK_FAILURES) {
        this.logger.error(
          `Max network failures (${this.holyrics.MAX_NETWORK_FAILURES}) reached. Triggering reconnection.`,
        );
        this.handleReconnection(); // Call the reconnection handler.
      }
    }
  };

  /**
   * @method startPollling
   * @description Initiates a continuous polling mechanism to scrape Bible verse data from the Holyrics page.
   * This method uses `setInterval` to periodically execute a logic block that:
   * 1. Prevents polling if the page is not available or if a connection attempt is already in progress.
   * 2. Monitors the health of the Puppeteer page and browser, triggering `handleReconnection` if either is disconnected or crashed.
   * 3. Executes JavaScript within the Puppeteer page (`this.page.evaluate`) to query the DOM using configured CSS selectors
   *    (for reference, text, and version) and extracts the text content.
   * 4. Cleans up the extracted text (trims whitespace, replaces multiple spaces with a single space).
   * 5. Performs checks to ensure the extracted data is valid before processing.
   * 6. Compares the `currentBibleVerse` with `this.previousBibleVerse`. The `callback` function is only invoked
   *    if a new verse is detected (different from the previous one) or if a verse disappears (becomes undefined).
   * 7. Updates `this.previousBibleVerse` to the current verse for the next comparison.
   * 8. Includes comprehensive error handling for DOM reading failures, logging errors,
   *    updating the status to inactive, and triggering `handleReconnection` to recover.
   * @param {MonitorBibleOutputParams} { callback } - An object containing the `callback` function, which will receive `BibleVerse` objects or `undefined` when updates occur.
   * @returns {Promise<void>}
   */
  private startPollling = async ({ callback }: MonitorBibleOutputParams): Promise<void> => {
    // Set up a recurring interval to perform polling at a frequency defined by `this.holyrics.POLLING_INTERVAL_MS`.
    this.intervalId = setInterval(async () => {
      // If the Puppeteer page is not available or a connection is already being established,
      // skip this polling cycle to avoid errors or race conditions.
      if (!this.page || this.isConnecting) {
        return;
      }

      // Check the health of the Puppeteer browser connection and if the page itself is closed.
      // Puppeteer doesn't directly expose `isCrashed`, so checking `browser.connected` and `page.isClosed()`
      // provides a good indication of page/browser integrity.
      const browserConnected = this.browser?.connected;
      if (!browserConnected || this.page.isClosed()) {
        this.logger.error('Page or browser is disconnected/crashed. Attempting reconnection');

        // Update application status to reflect the disconnection.
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

        await this.handleReconnection(); // Trigger a full reconnection sequence.
        return; // Exit the current polling cycle.
      }

      try {
        // Execute JavaScript within the Puppeteer page to extract Bible verse data.
        // `page.evaluate` runs the provided function in the browser's context.
        const currentBibleVerse = await this.page.evaluate(
          (referenceSelector: string, textSelector: string, versionSelector: string) => {
            // Query the DOM for HTML elements corresponding to the Bible verse components using configured CSS selectors.
            const referenceHtmlObject = document.querySelector(referenceSelector);
            const texHtmlObjectt = document.querySelector(textSelector);
            const versionHtmlObject = document.querySelector(versionSelector);

            // Extract text content, trim whitespace, and normalize multiple spaces to single spaces.
            const reference = referenceHtmlObject?.textContent?.trim().replace(/\s\s+/g, ' ');
            const text = texHtmlObjectt?.textContent?.trim().replace(/\s\s+/g, ' ');
            const version = versionHtmlObject?.textContent?.trim().replace(/\s\s+/g, ' ');

            // If any of the essential parts are missing or not strings, return `undefined`,
            // indicating that no valid Bible verse could be extracted.
            if (
              !reference ||
              !text ||
              !version ||
              typeof reference !== 'string' ||
              typeof text !== 'string' ||
              typeof version !== 'string'
            )
              return;

            // Return the extracted Bible verse object.
            return {
              reference,
              text,
              version,
            };
          },
          // Pass the configured CSS selectors from `this.holyrics` into the `evaluate` function's context.
          this.holyrics.REFERENCE_SELECTOR,
          this.holyrics.TEXT_SELECTOR,
          this.holyrics.VERSION_SELECTOR,
        );

        // Logic to handle cases where network failures or connections are in progress:
        // If there were network failures or a connection is ongoing, and a previous verse exists,
        // clear the previous verse and trigger the callback with `undefined` to signify that
        // the verse is no longer reliably available.
        if (this.networkFailureCount > 0 || this.isConnecting) {
          if (!this.previousBibleVerse) return; // If no previous verse, nothing to do.

          this.previousBibleVerse = undefined; // Clear the previous verse.
          return callback(undefined); // Notify listeners that the verse is gone.
        }

        // Handle the case where a previous verse existed but the current poll found no verse.
        // This signifies the verse has been removed from the display.
        if (this.previousBibleVerse && !currentBibleVerse) {
          this.previousBibleVerse = undefined; // Clear the previous verse.
          return callback(undefined); // Notify listeners.
        }

        // If both previous and current verses exist and their references are identical,
        // no change has occurred, so there's no need to trigger the callback.
        if (
          this.previousBibleVerse &&
          currentBibleVerse &&
          this.previousBibleVerse.reference === currentBibleVerse.reference
        ) {
          return;
        }

        // If no current Bible verse was found (and it wasn't a case of a disappearing verse),
        // then there's nothing to update or report.
        if (!currentBibleVerse) return;

        // If a new or different Bible verse is detected, update `previousBibleVerse`
        // and invoke the callback with the new verse.
        this.previousBibleVerse = currentBibleVerse;
        callback(currentBibleVerse);
      } catch (error) {
        const errorMessage = (error as Error).message.split('\n')[0]; // Extract concise error message.
        this.logger.error('Failed to read DOM during polling', { error: errorMessage });

        // Update application status to inactive due to DOM reading failure.
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

        // If a DOM reading error occurs and no connection is currently active,
        // it might indicate a corrupted page state. Trigger a reconnection to get a fresh page.
        if (!this.isConnecting) {
          this.logger.warn('DOM reading failed. Attempting reconnection');
          await this.handleReconnection();
        }
      }
    }, this.holyrics.POLLING_INTERVAL_MS); // Use the configured polling interval.
  };

  /**
   * @method monitorBibleOutput
   * @description The main public method to start monitoring Holyrics for Bible verse updates.
   * This method performs the following high-level actions:
   * 1. Logs the start of the monitoring process.
   * 2. Initiates a robust connection to Holyrics by calling `handleReconnection`. This ensures
   *    that the browser is launched and connected before polling begins.
   * 3. Calls `startPollling` to begin the periodic scraping of Bible verses.
   * 4. Updates the application status via `this.notifier` to indicate that Holyrics monitoring is active.
   * 5. Registers a `SIGINT` (interrupt signal, e.g., Ctrl+C) handler to ensure that `this.destroy()`
   *    is called for graceful resource cleanup when the process is terminated.
   * @param {MonitorBibleOutputParams} params - An object containing the `callback` function that will be executed
   *                                            whenever a new Bible verse is detected or the current one changes.
   * @returns {Promise<void>}
   */
  monitorBibleOutput = async (params: MonitorBibleOutputParams) => {
    this.logger.info('Starting Holyrics monitoring');

    // Ensure a connection is established or re-established before starting to poll.
    await this.handleReconnection();

    // Begin the continuous polling for Bible verse updates.
    this.startPollling(params);

    this.logger.info('Holyrics monitoring started');

    // Update the system status to indicate that Holyrics monitoring is active.
    this.notifier.setStatus({
      subject: 'holyrics',
      items: {
        active: true,
      },
    });

    // Register a listener for the process's SIGINT signal.
    // This allows for a graceful shutdown, ensuring that browser resources are properly closed
    // when the application receives an interrupt signal (e.g., from a user pressing Ctrl+C).
    process.on('SIGINT', async () => {
      await this.destroy(); // Call the destroy method for cleanup.
    });
  };

  /**
   * @method destroy
   * @description Performs a comprehensive cleanup of all resources managed by the `HolyricsBible` instance.
   * This public method is crucial for preventing resource leaks and ensuring proper application shutdown.
   * It executes the following cleanup operations:
   * 1. Clears the `setInterval` timer associated with polling (`this.intervalId`).
   * 2. If a Puppeteer page exists, it detaches all previously bound event listeners (`request`, `requestfailed`)
   *    and then attempts to close the page. Error handling is included for page closure.
   * 3. If a Puppeteer browser exists, it attempts to close the browser. Error handling is included for browser closure.
   * 4. Resets all internal state flags (`isConnecting`, `isReconnecting`, `previousBibleVerse`, `networkFailureCount`)
   *    to their initial `undefined` or `false`/`0` states, preparing the instance for potential re-initialization.
   * 5. Updates the Holyrics status via `this.notifier` to `inactive` to reflect that monitoring has ceased.
   * @returns {Promise<void>}
   */
  public destroy = async (): Promise<void> => {
    this.logger.info('Cleaning up resources');

    // Clear the polling interval if it's active, preventing further polling.
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined; // Reset the interval ID.
    }

    // If a Puppeteer page exists, perform cleanup.
    if (this.page) {
      const currentPage = this.page; // Capture reference to current page to avoid `this.page` being nullified during async operations.
      // Detach any event listeners (`request`, `requestfailed`) from the page to prevent memory leaks.
      if (this.boundHandleRequest) {
        currentPage.off('request', this.boundHandleRequest);
        this.boundHandleRequest = undefined;
      }
      if (this.boundHandleRequestFailed) {
        currentPage.off('requestfailed', this.boundHandleRequestFailed);
        this.boundHandleRequestFailed = undefined;
      }

      try {
        await currentPage.close(); // Attempt to close the Puppeteer page.
      } catch (error) {
        this.logger.error('Failed to close page', { error: (error as Error).message });
      } finally {
        this.page = undefined; // Ensure the page reference is cleared, regardless of closure success.
      }
    }

    // If a Puppeteer browser exists, perform cleanup.
    if (this.browser) {
      try {
        await this.browser.close(); // Attempt to close the Puppeteer browser.

        // Update the application status to inactive after the browser is closed.
        this.notifier.setStatus({
          subject: 'holyrics',
          items: {
            active: false,
          },
        });
      } catch (error) {
        this.logger.error('Failed to close browser', { error: (error as Error).message });
      } finally {
        this.browser = undefined; // Ensure the browser reference is cleared.
      }
    }

    // Reset all internal state flags and cached data to their initial values.
    this.isConnecting = false;
    this.isReconnecting = false;
    this.previousBibleVerse = undefined;
    this.networkFailureCount = 0;
  };
}
