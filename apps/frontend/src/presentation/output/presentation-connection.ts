import { socket } from '@/src/config';
import { useEffect, useMemo, useState } from 'react';

interface Presentation {
  id: string;
  code: string;
  title: string;
  description: string;
  qrCodeContent: string;
  imageUrl: string;
  enabled: boolean;
}

interface Slide {
  enabled: boolean;
  label: string;
  notes: string;
  text: string;
}

export interface CurrentSlideDto {
  currentSlide?: Slide | null;
  displayEnabled?: boolean;
}

export interface CurrentPresentationDto {
  presentation?: Presentation | null;
  displayEnabled?: boolean;
}

export const usePresentationConnection = () => {
  const [currentPresentation, setCurrentPresentation] = useState<CurrentPresentationDto>({
    displayEnabled: false,
  });

  const [currentSlide, setCurentSlide] = useState<CurrentSlideDto>({
    displayEnabled: false,
  });

  useEffect(() => {
    socket.on('slide', (data: CurrentPresentationDto) => {
      console.log('Slide data:', data);
      setCurrentPresentation(data);
    });

    socket.on('music-slide', (data: CurrentSlideDto) => {
      console.log('music slide data', data);
      setCurentSlide(data);
    });
  }, []);

  const memoizedValues = useMemo(
    () => ({
      currentPresentation,
      currentSlide,
    }),
    [currentPresentation, currentSlide],
  );

  return memoizedValues;
};
