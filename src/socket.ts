
interface Presentation {
  id: string;
  code: string;
  title: string;
  description: string;
  qrCodeContent: string;
  imageUrl: string;
  enabled: boolean;
}
export interface CurrentPresentationDto {
  presentation?: Presentation | null;
  displayEnabled?: boolean;
}

import { io } from 'socket.io-client'

export const socket = io('http://localhost:5000', {
  transports: ['websocket'],
});


socket.on('connect', () => {
  console.log('Connected to server');
});

