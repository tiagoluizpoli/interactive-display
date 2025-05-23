import { httpClient } from '../config';
import type { AxiosError } from 'axios';

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

type SlideCallback = (code: string) => void;
type PublicStateCallback = (state: boolean) => void;
type ClearPresentationCallback = () => void;

interface RetryParams {
  setupStream: SetupStream;
  callback?: ClearPresentationCallback;
  logMessage?: string;
}

type SetupStream = (retries?: number) => Promise<void>;

export class ProPresenter {
  private readonly RETRY_DELAY = 2000; // 2 seconds

  async onSlideChange(callback: (code: string) => void): Promise<void> {
    const setupStream = async (): Promise<void> => {
      try {
        console.log('Connecting to ProPresenter slide stream...');
        const response = await httpClient.get('/v1/transport/presentation/current', {
          params: {
            chunked: true,
          },
          responseType: 'stream',
        });

        console.log('Connected to ProPresenter slide stream successfully');

        response.data.on('data', (chunk: Buffer) => this.onSlideDataCallback(chunk, callback));

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
        const response = await httpClient.get('/v1/status/audience_screens', {
          params: {
            chunked: true,
          },
          responseType: 'stream',
        });

        console.log('Connected to ProPresenter audience screen status successfully');

        response.data.on('data', (chunk: Buffer) => this.onPublicStateDataCallback(chunk, callback));

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

  private onSlideDataCallback = (chunk: Buffer, callback: SlideCallback) => {
    try {
      const data = chunk.toString();
      const slide: Slide = JSON.parse(data);

      console.log('Received slide:', slide.name);

      callback(slide.name);
    } catch (parseError) {
      console.error('Error parsing slide data:', parseError);
      // Continue listening even if one message failed to parse
    }
  };

  private onPublicStateDataCallback = (chunk: Buffer, callback: PublicStateCallback) => {
    try {
      const data = chunk.toString();
      const active: boolean = JSON.parse(data);
      callback(active);
    } catch (parseError) {
      console.error('Error parsing status data:', parseError);
      // Continue listening even if one message failed to parse
    }
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
