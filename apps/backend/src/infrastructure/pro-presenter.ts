import type { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { proPresenterHttpClient } from '../config';
import type { Music } from '@/models/music';
import type { Readable } from 'node:stream';
import { createChildLogger } from '../config/logger';

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
  private readonly RETRY_DELAY = 3000; // 3 seconds
  private readonly logger = createChildLogger('ProPresenter');

  async onPresentationFocusedChanged(callback: (music: Music | null) => void): Promise<StreamSubscription> {
    return this.createStreamSubscription(
      '/v1/presentation/focused',
      async (slide: PresentationId) => {
        try {
          const musicResponse = await proPresenterHttpClient.get<Music>(`/v1/presentation/${slide.uuid}`);
          callback(musicResponse.data);
        } catch (error) {
          this.logger.error('Error fetching presentation details', {
            error: (error as Error).message,
          });
        }
      },
      () => callback(null),
    );
  }

  async onPresentationSlideIndexChanged(
    callback: (params: PresentationSlideIndexParams | null) => void,
  ): Promise<StreamSubscription> {
    return this.createStreamSubscription<PresentationSlideIndex>(
      '/v1/presentation/slide_index',
      (slide) => {
        if (slide.presentation_index) {
          return callback({
            slideIndex: slide.presentation_index.index,
            presentationUuid: slide.presentation_index.presentation_id.uuid,
          });
        }
        callback(null);
      },
      () => callback(null),
    );
  }

  async onSlideChange(callback: (code: string) => void): Promise<StreamSubscription> {
    return this.createStreamSubscription<Slide>(
      '/v1/transport/presentation/current',
      (slide) => {
        callback(slide.name);
      },
      () => callback(''),
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
        const response = await proPresenterHttpClient.get(route, chunkedRequestConfig);
        stream = response.data;
        this.logger.info('Connected to ProPresenter stream successfully', { route });

        this.onData<TResult>(response, (data) => {
          if (!stopped) {
            dataCallback(data);
          }
        });

        stream!.on('end', () =>
          this.retry({
            setupStream,
            logMessage: 'Stream ended. Reconnecting.',
            stopped,
            callback: cleanupCallback,
            route,
          }),
        );
        stream!.on('error', (err: any) =>
          this.retry({
            setupStream,
            logMessage: 'Stream error.',
            stopped,
            callback: cleanupCallback,
            route,
            error: err.message,
          }),
        );
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
      this.retry({
        setupStream,
        logMessage: 'ProPresenter connection refused. Retrying.',
        stopped: false,
        delay: this.RETRY_DELAY,
      });
    } else {
      this.logger.error('Error connecting to ProPresenter', {
        message: axiosError.message,
        code: axiosError.code,
        status: axiosError.response?.status,
      });
      this.retry({ setupStream, callback, stopped: false });
    }
  };
}
