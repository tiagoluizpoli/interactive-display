import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { Music } from '@/models/music';
import type { Readable } from 'node:stream';
import { createChildLogger } from '../config/logger';
import axios from 'axios';
import type { ProPresenterConfig, StatusNotifier } from '@/config';

export interface Slide {
  is_playing: boolean;
  uuid: {
    string: string;
  } | null;
  name: string;
  artist: string;
  audio_only: boolean;
  duration: number;
}

export interface PresentationId {
  uuid: string;
  name: string;
  index: number;
}

export interface PresentationSlideIndex {
  presentation_index: {
    index: number;
    presentation_id: PresentationId;
  } | null;
}

type ClearPresentationCallback = () => void;

interface RetryParams {
  setupStream: SetupStream;
  callback?: ClearPresentationCallback;
  logMessage?: string;
  stopped: boolean;
}

type SetupStream = (retries?: number) => Promise<void>;

export interface PresentationSlideIndexParams {
  slideIndex: number;
  presentationUuid: string;
}

export interface StreamSubscription {
  destroy: () => void;
}

const chunkedRequestConfig: AxiosRequestConfig = {
  params: {
    chunked: true,
  },
  responseType: 'stream',
};
export class ProPresenter {
  private client: AxiosInstance;

  constructor(
    private params: ProPresenterConfig,
    private readonly notifier: StatusNotifier,
  ) {
    const { HOST, PORT } = this.params;
    this.client = axios.create({
      baseURL: `http://${HOST}:${PORT}`,
    });
  }

  private readonly RETRY_DELAY = 3000; // 3 seconds
  private readonly logger = createChildLogger('ProPresenter');

  async onPresentationFocusedChanged(callback: (music: Music | null) => void): Promise<StreamSubscription> {
    return this.createStreamSubscription(
      '/v1/presentation/focused',
      async (slide: PresentationId) => {
        try {
          const musicResponse = await this.client.get<Music>(`/v1/presentation/${slide.uuid}`);
          this.logger.info('Presentation Fetched', {
            action: 'presentation-focused-changed',
            presentationId: slide.uuid,
            presentationName: musicResponse.data.presentation.id.name,
            presentationSlideCount: musicResponse.data.presentation.groups.reduce(
              (acc, group) => acc + group.slides.length,
              0,
            ),
          });

          callback(musicResponse.data);
        } catch (error) {
          this.logger.error('Error fetching presentation details', {
            action: 'presentation-focused-changed',
            error: (error as Error).message,
          });

          this.notifier.setStatus({
            subject: 'pro-presenter',
            items: {
              active: false,
            },
            logs: [{ message: 'Error fetching presentation details' }],
          });
        }
      },
      () => {
        this.logger.info('Presentation cleared', {
          action: 'presentation-focused-changed',
        });
        callback(null);
      },
    );
  }

  async onPresentationSlideIndexChanged(
    callback: (params: PresentationSlideIndexParams | null) => void,
  ): Promise<StreamSubscription> {
    return this.createStreamSubscription<PresentationSlideIndex>(
      '/v1/presentation/slide_index',
      (slide) => {
        this.logger.info('Slide index changed', { slideIndex: slide.presentation_index?.index ?? null });

        if (slide.presentation_index?.index !== undefined) {
          return callback({
            slideIndex: slide.presentation_index.index,
            presentationUuid: slide.presentation_index.presentation_id.uuid,
          });
        }

        callback(null);
      },
      () => {
        this.logger.info('Slide index cleared');
        callback(null);
      },
    );
  }

  async onPublicStateChange(callback: (state: boolean) => void): Promise<StreamSubscription> {
    return this.createStreamSubscription<boolean>('/v1/status/audience_screens', callback, () => callback(false));
  }

  private async createStreamSubscription<TResult>(
    route: string,
    dataCallback: (data: TResult) => void,
    cleanupCallback: ClearPresentationCallback,
  ): Promise<StreamSubscription> {
    let stream: Readable | null = null;
    let stopped = false;

    const setupStream = async (): Promise<void> => {
      if (stopped) return;
      try {
        this.logger.info('Connecting to ProPresenter stream', { route });
        const response = await this.client.get(route, chunkedRequestConfig);
        stream = response.data;
        this.logger.info('Connected to ProPresenter stream successfully', { route });

        this.notifier.setStatus({
          subject: 'pro-presenter',
          items: {
            active: true,
          },
          logs: [
            {
              message: 'Connected to ProPresenter stream successfully',
              context: { route },
            },
          ],
        });

        this.onData<TResult>(response, (data) => {
          if (!stopped) {
            dataCallback(data);
          }
        });

        stream!.on('end', () => {
          this.notifier.setStatus({
            subject: 'pro-presenter',
            items: {
              active: false,
            },
            logs: [
              {
                message: 'pro-presenter off',
                context: { route },
              },
            ],
          });

          this.retry({
            setupStream,
            logMessage: 'Stream ended. Reconnecting.',
            stopped,
            callback: cleanupCallback,
            route,
          });
        });
        stream!.on('error', (err: any) => {
          this.notifier.setStatus({
            subject: 'pro-presenter',
            items: {
              active: false,
            },
            logs: [
              {
                message: 'pro-presenter off',
                context: { route },
              },
            ],
          });

          this.retry({
            setupStream,
            logMessage: 'Stream error.',
            stopped,
            callback: cleanupCallback,
            route,
            error: err.message,
          });
        });
      } catch (error) {
        if (stopped) return;
        this.onError(error, setupStream, cleanupCallback);
      }
    };

    await setupStream();

    return {
      destroy: () => {
        stopped = true;
        if (stream) {
          stream.destroy();
        }
      },
    };
  }

  private onData = <TResult>(response: AxiosResponse, callback: (data: TResult) => void) => {
    response.data.on('data', async (chunk: Buffer) => {
      try {
        const data: TResult = JSON.parse(chunk.toString());
        callback(data);
      } catch (parseError) {
        this.logger.error('Error parsing chunk', { error: parseError });
      }
    });
  };

  private retry = ({ callback, setupStream, logMessage, stopped, ...metadata }: RetryParams & Record<string, any>) => {
    if (stopped) return;
    if (callback) callback();
    if (logMessage) this.logger.info(logMessage, { ...metadata });
    setTimeout(() => setupStream(), this.RETRY_DELAY);
  };

  private onError = (error: any, setupStream: SetupStream, callback: ClearPresentationCallback) => {
    const axiosError = error as AxiosError;
    const code = axiosError.code || '';
    const isConnectionRefused = code === 'ECONNREFUSED' || code === 'ECONNRESET';

    if (isConnectionRefused) {
      this.notifier.setStatus({
        subject: 'pro-presenter',
        items: {
          active: false,
        },
        logs: [{ message: 'ProPresenter connection refused', context: { code, url: this.client.defaults.baseURL } }],
      });

      this.retry({
        setupStream,
        logMessage: 'ProPresenter connection refused. Retrying.',
        stopped: false,
        delay: this.RETRY_DELAY,
      });

      return;
    }

    this.logger.error('Error connecting to ProPresenter', {
      message: axiosError.message,
      code: axiosError.code,
      status: axiosError.response?.status,
    });

    this.notifier.setStatus({
      subject: 'pro-presenter',
      items: {
        active: false,
      },
      logs: [
        {
          message: 'Error connecting to ProPresenter',
          context: { code, url: this.client.defaults.baseURL, status: axiosError.response?.status },
        },
      ],
    });

    this.retry({ setupStream, callback, stopped: false });
  };
  public updateConfig(newConfig: ProPresenterConfig): void {
    this.params = newConfig;

    const { HOST, PORT } = newConfig;
    this.client = axios.create({
      baseURL: `http://${HOST}:${PORT}`,
    });

    this.logger.info('ProPresenter configuration updated.', { action: 'update-config', newConfig });
  }
}
