import { listenTo, queryKeys } from '@/src/config';
import { useQueryClient } from '@tanstack/react-query';
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

export interface Slide {
  enabled: boolean;
  label: string;
  notes: string;
  text: string;
}

export interface BibleSlide {
  reference: string;
  text: string;
  version: string;
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
  const queryClient = useQueryClient();
  const [currentPresentation, setCurrentPresentation] = useState<CurrentPresentationDto>({
    displayEnabled: false,
  });

  const [currentSlide, setCurentSlide] = useState<CurrentSlideDto>({
    displayEnabled: false,
  });

  const [bibleSlide, setBibleSlide] = useState<BibleSlide | null>(null);

  useEffect(() => {
    listenTo('slide', (data: CurrentPresentationDto) => {
      console.log('Slide data:', data);
      setCurrentPresentation(data);
    });

    listenTo('music-slide', (data: CurrentSlideDto) => {
      console.log('music slide data', data);
      setCurentSlide(data);
    });

    listenTo('bible-slide', (data: BibleSlide | null) => {
      console.log('Bible slide data:', data);
      setBibleSlide(data);
    });

    listenTo('style-updated', (data) => {
      console.log({ data });
      queryClient.invalidateQueries({
        queryKey: queryKeys.styles.active(data.code),
      });
    });
  }, []);

  const memoizedValues = useMemo(
    () => ({
      currentPresentation,
      currentSlide,
      bibleSlide,
    }),
    [currentPresentation, currentSlide, bibleSlide],
  );

  return memoizedValues;
};
