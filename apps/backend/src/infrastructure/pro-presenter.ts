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
        console.log('Connecting to ProPresenter focused presentation stream...');
        const response = await httpClient.get('/v1/presentation/focused', chunkedRequestConfig);

        console.log('Connecting to ProPresenter focused presentation stream...');

        this.onData<PresentationId>(response, async (slide) => {
          console.log('Received presentation:', slide.name);

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

  async onPresentationSlideIndexChanged(callback: (slideIndex: number | null) => void): Promise<void> {
    const setupStream = async (): Promise<void> => {
      try {
        console.log('Connecting to ProPresenter focused presentation stream...');
        const response = await httpClient.get('/v1/presentation/slide_index', chunkedRequestConfig);

        console.log('Connecting to ProPresenter focused presentation stream...');

        this.onData<PresentationSlideIndex>(response, (slide) => {
          if (slide.presentation_index) {
            console.log('Received slide index:', slide.presentation_index.index);

            return callback(slide.presentation_index.index);
          }

          console.log('Received null slide index');

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
        console.log('Connecting to ProPresenter slide stream...');
        const response = await httpClient.get('/v1/transport/presentation/current', chunkedRequestConfig);

        console.log('Connected to ProPresenter slide stream successfully');

        this.onData<Slide>(response, (slide) => {
          console.log('Received slide:', slide.name);

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
        console.log('Connecting to ProPresenter audience screen status...');
        const response = await httpClient.get('/v1/status/audience_screens', chunkedRequestConfig);

        console.log('Connected to ProPresenter audience screen status successfully');

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
