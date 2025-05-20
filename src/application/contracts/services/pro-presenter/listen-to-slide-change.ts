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

export interface ListenToSlideChange {
  onSlideChange: (callback: (code: string) => void) => Promise<void>;
  onPublicStateChange: (callback: (state: boolean) => void) => Promise<void>;
}
