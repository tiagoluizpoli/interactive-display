import { env } from '@/config';
import puppeteer, { type Browser, type Page } from 'puppeteer';

export interface BibleVerse {
  reference: string;
  text: string;
  version: string;
}

interface MonitorBibleOutputParams {
  callback: (bibleVerse: BibleVerse | undefined) => void;
}

const { holyrics } = env.services;

export class HolyricsBible {
  private browser?: Browser;
  private page?: Page;
  private previousBibleVerse?: BibleVerse;
  private intervalId?: NodeJS.Timeout;

  private isConnecting = false;

  private delay = (ms: number) => {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  };

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

      await this.page!.goto(holyrics.url, { waitUntil: 'domcontentloaded', timeout: holyrics.timeout * 1000 });
      console.log('HolyricsBible :: connectToHolyrics :: [OK] :: Página do holyrics carregada ');

      this.isConnecting = false;
      return true;
    } catch (error) {
      const errorMessage = (error as Error).message.split('\n')[0];

      console.error(`HolyricsBible :: connectToHolyrics :: [ERRO] :: Falha ao conectar: ${errorMessage}`);

      if (this.browser) {
        console.log('HolyricsBible :: connectToHolyrics :: [ERRO] :: Fechando o browser para limpeza');
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
      console.log('HolyricsBible :: handleReconnection :: Fechando o browser existente para reconexão');
      await this.browser.close();
      this.browser = undefined;
      this.page = undefined;
    }

    while (!(await this.connectToHolyrics())) {
      console.log(
        `HolyricsBible :: handleReconnection :: [RECONEXÃO] :: Nova tentativa em ${holyrics.retryTime} segundos`,
      );

      await this.delay(holyrics.retryTime * 1000);
    }
  };

  private startPollling = async ({ callback }: MonitorBibleOutputParams): Promise<void> => {
    this.intervalId = setInterval(async () => {
      if (!this.page || this.isConnecting) {
        return;
      }

      // Check if the page is closed or crashed
      // Puppeteer doesn't expose isCrashed directly, but we can check if the browser is still connected
      const browserConnected = this.browser?.isConnected();
      if (!browserConnected || this.page.isClosed()) {
        console.error(
          'HolyricsBible :: startPollling :: [ERRO POLLING] :: Page or browser is disconnected/crashed. Attempting reconnection.',
        );
        await this.handleReconnection();
        return;
      }

      try {
        const currentBibleVerse = await this.page.evaluate(
          (referenceSelector: string, textSelector: string, versionSelector: string) => {
            const referenceHtmlObject = document.querySelector(referenceSelector);
            const texHtmlObjectt = document.querySelector(textSelector);
            const versionHtmlObject = document.querySelector(versionSelector);

            const reference = referenceHtmlObject?.textContent.trim().replace(/\s\s+/g, ' ');
            const text = texHtmlObjectt?.textContent.trim().replace(/\s\s+/g, ' ');
            const version = versionHtmlObject?.textContent.trim().replace(/\s\s+/g, ' ');

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
          holyrics.selectors.referenceSelector,
          holyrics.selectors.textSelectoor,
          holyrics.selectors.versionSelector,
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
        console.error(
          `HolyricsBible :: startPollling :: [ERRO POLLING] :: Falha ao ler DOM: ${(error as Error).message.split('\n')[0]}`,
        );

        console.error(
          `HolyricsBible :: startPollling :: [ERRO POLLING] :: Falha ao ler DOM: ${(error as Error).message.split('\n')[0]}`,
        );
        // If an error occurs during evaluation, it might indicate a problem with the page.
        // Attempt to reconnect to ensure a fresh page instance.
        if (!this.isConnecting) {
          console.log('HolyricsBible :: startPollling :: [ERRO POLLING] :: Falha ao ler DOM. Tentando reconexão.');
          await this.handleReconnection();
        }
      }
    }, holyrics.pollingIntervalMs);
  };

  monitorBibleOutput = async (params: MonitorBibleOutputParams) => {
    console.log('HolyricsBible :: monitorBibleOutput :: Iniciando monitoramento do Holyrics');

    await this.handleReconnection();

    this.startPollling(params);

    console.log('HolyricsBible :: monitorBibleOutput :: Monitoramento iniciado');

    process.on('SIGINT', async () => {
      await this.destroy();
    });
  };

  public destroy = async (): Promise<void> => {
    console.log('HolyricsBible :: destroy :: Cleaning up resources');
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    if (this.page) {
      try {
        await this.page.close();
      } catch (error) {
        console.error(`HolyricsBible :: destroy :: [ERRO] :: Falha ao fechar a página: ${(error as Error).message}`);
      } finally {
        this.page = undefined;
      }
    }
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (error) {
        console.error(`HolyricsBible :: destroy :: [ERRO] :: Falha ao fechar o browser: ${(error as Error).message}`);
      } finally {
        this.browser = undefined;
      }
    }
    this.isConnecting = false;
    this.previousBibleVerse = undefined;
  };
}
