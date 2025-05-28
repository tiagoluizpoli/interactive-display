import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';

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
const socket = io('http://localhost:5000', {
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('Connected to server');
});

export const usePresentationConnection = () => {
  const [currentPresentation, setCurrentPresentation] = useState<CurrentPresentationDto>({
    displayEnabled: false,
  });

  useEffect(() => {
    socket.on('slide', (data: CurrentPresentationDto) => {
      console.log('Slide data:', data);
      setCurrentPresentation(data);
    });
  }, []);

  const memoizedValues = useMemo(
    () => ({
      currentPresentation,
      socket,
    }),
    [currentPresentation],
  );

  return memoizedValues;
};
