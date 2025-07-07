import type { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { httpClient } from '../config';
import type { Music } from '@/models/music';

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
}

type SetupStream = (retries?: number) => Promise<void>;

export interface PresentationSlideIndexParams {
  slideIndex: number;
  presentationUuid: string;
}

const chunkedRequestConfig: AxiosRequestConfig = {
  params: {
    chunked: true,
  },
  responseType: 'stream',
};
export class ProPresenter {
  private readonly RETRY_DELAY = 3000; // 2 seconds

  async onPresentationFocusedChanged(callback: (music: Music | null) => void): Promise<void> {
    const setupStream = async (): Promise<void> => {
      try {
        const route = '/v1/presentation/focused';

        console.log(`Connecting to ProPresenter ${route} stream...`);
        const response = await httpClient.get(route, chunkedRequestConfig);

        console.log(`Connected to ProPresenter ${route} stream successfully`);

        this.onData<PresentationId>(response, async (slide) => {
          const musicResponse = await httpClient.get<Music>(`/v1/presentation/${slide.uuid}`);

          callback(musicResponse.data);
        });

        response.data.on('end', () =>
          this.retry({
            setupStream,
            logMessage: 'Slide stream ended. Reconnecting...',
            callback: () => callback(null),
          }),
        );

        response.data.on('error', (err: any) =>
          this.retry({ setupStream, logMessage: `Stream error: ${err}`, callback: () => callback(null) }),
        );
      } catch (error) {
        this.onError(error, setupStream, () => callback(null));
      }
    };

    // Start the connection process
    await setupStream();
  }

  async onPresentationSlideIndexChanged(
    callback: (params: PresentationSlideIndexParams | null) => void,
  ): Promise<void> {
    const setupStream = async (): Promise<void> => {
      try {
        const route = '/v1/presentation/slide_index';

        console.log(`Connecting to ProPresenter ${route} stream...`);

        const response = await httpClient.get(route, chunkedRequestConfig);

        console.log(`Connected to ProPresenter ${route} stream successfully`);

        this.onData<PresentationSlideIndex>(response, (slide) => {
          if (slide.presentation_index) {
            return callback({
              slideIndex: slide.presentation_index.index,
              presentationUuid: slide.presentation_index.presentation_id.uuid,
            });
          }

          callback(null);
        });

        response.data.on('end', () =>
          this.retry({
            setupStream,
            logMessage: 'Slide stream ended. Reconnecting...',
            callback: () => callback(null),
          }),
        );

        response.data.on('error', (err: any) =>
          this.retry({ setupStream, logMessage: `Stream error: ${err}`, callback: () => callback(null) }),
        );
      } catch (error) {
        this.onError(error, setupStream, () => callback(null));
      }
    };

    // Start the connection process
    await setupStream();
  }

  async onSlideChange(callback: (code: string) => void): Promise<void> {
    const setupStream = async (): Promise<void> => {
      try {
        const route = '/v1/transport/presentation/current';

        console.log(`Connecting to ProPresenter ${route} stream...`);
        const response = await httpClient.get(route, chunkedRequestConfig);

        console.log(`Connected to ProPresenter ${route} stream successfully`);

        this.onData<Slide>(response, (slide) => {
          callback(slide.name);
        });

        response.data.on('end', () =>
          this.retry({ setupStream, logMessage: 'Slide stream ended. Reconnecting...', callback: () => callback('') }),
        );

        response.data.on('error', (err: any) =>
          this.retry({ setupStream, logMessage: `Stream error: ${err}`, callback: () => callback('') }),
        );
      } catch (error) {
        this.onError(error, setupStream, () => callback(''));
      }
    };

    // Start the connection process
    await setupStream();
  }

  async onPublicStateChange(callback: (state: boolean) => void): Promise<void> {
    const setupStream = async (): Promise<void> => {
      try {
        const route = '/v1/status/audience_screens';

        console.log(`Connecting to ProPresenter ${route} status...`);
        const response = await httpClient.get(route, chunkedRequestConfig);

        console.log(`Connected to ProPresenter ${route} status successfully`);

        this.onData<boolean>(response, callback);

        response.data.on('end', () =>
          this.retry({
            setupStream,
            logMessage: 'Status stream ended. Reconnecting...',
            callback: () => callback(false),
          }),
        );

        response.data.on('error', (err: any) =>
          this.retry({ setupStream, logMessage: `Stream error: ${err}`, callback: () => callback(false) }),
        );
      } catch (error) {
        this.onError(error, setupStream, () => callback(false));
      }
    };

    // Start the connection process
    await setupStream();
  }

  private onData = <TResult>(response: AxiosResponse, callback: (data: TResult) => void) => {
    response.data.on('data', async (chunk: Buffer) => {
      try {
        const data: TResult = JSON.parse(chunk.toString());
        callback(data);
      } catch (parseError) {
        console.error('Error parsing chunk', parseError);
        // Continue listening even if one message failed to parse
      }
    });
  };

  private retry = ({ callback, setupStream, logMessage }: RetryParams) => {
    if (callback) callback();
    if (logMessage) console.log(logMessage);
    setTimeout(() => setupStream(), this.RETRY_DELAY);
  };

  private onError = (error: any, setupStream: SetupStream, callback: ClearPresentationCallback) => {
    const axiosError = error as AxiosError;
    const code = axiosError.code || '';
    const isConnectionRefused = code === 'ECONNREFUSED' || code === 'ECONNRESET';

    if (isConnectionRefused) {
      this.retry({
        setupStream,
        logMessage: `ProPresenter connection refused. Retrying in ${this.RETRY_DELAY} seconds...`,
      });
    } else {
      console.error('Error connecting to ProPresenter:', {
        message: axiosError.message,
        code: axiosError.code,
        status: axiosError.response?.status,
      });
      // For other errors, still retry but with base delay
      this.retry({ setupStream, callback });
    }
  };
}
