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
    return Promise.resolve((res: () => void) => setTimeout(res, ms));
  };

  private launchBrowser = async () => {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
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
        this.browser = undefined;
        this.page = undefined;
      }

      this.isConnecting = false;
      return false;
    }
  };

  private handleReconnection = async () => {
    while (!(await this.connectToHolyrics())) {
      console.log(
        `HolyricsBible :: handleReconnection :: [RECONEXÃO] :: Nova tentativa em ${holyrics.retryTime} segundos`,
      );

      await this.delay(holyrics.retryTime * 1000);
    }
  };

  private startPollling = async ({ callback }: MonitorBibleOutputParams) => {
    this.intervalId = setInterval(async () => {
      if (!this.page || this.isConnecting) return;

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

        if (!this.isConnecting) {
          console.log('HolyricsBible :: startPollling :: [ERRO POLLING] :: Falha ao ler DOM');
          await this.delay(holyrics.retryTime * 1000);
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
      if (this.browser) await this.browser.close();
    });
  };

  public destroy = async () => {
    console.log('HolyricsBible :: destroy :: Cleaning up resources');
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.browser) {
      await this.browser.close();
    }
  };
}
