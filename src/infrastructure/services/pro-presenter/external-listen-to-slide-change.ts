import type { ListenToSlideChange, Slide } from '../../../application';
import { httpClient } from '../../../main/config';

export class ExternalListenToSlideChange implements ListenToSlideChange {
  async onSlideChange(callback: (slide: Slide) => void): Promise<void> {
    const response = await httpClient.get('/v1/transport/presentation/current', {
      params: {
        chunked: true,
      },
      responseType: 'stream',
    });

    response.data.on('data', (chunk: Buffer) => {
      const data = chunk.toString();

      try {
        const slide: Slide = JSON.parse(data);

        callback(slide);
      } catch (error) {
        console.error('Error parsing slide data:', error);
      }
    });

    response.data.on('end', () => {
      console.log('Stream ended');
    });

    response.data.on('error', (error: Error) => {
      console.error('Error in stream:', error);
    });
  }
}
