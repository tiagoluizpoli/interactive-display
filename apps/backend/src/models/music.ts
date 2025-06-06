export interface Music {
  presentation: MusicPresentation;
}

export interface MusicPresentation {
  id: Id;
  destination: string;
  groups: Group[];
  has_timeline: boolean;
  presentation_path: string;
}

export interface Group {
  color: Color | null;
  name: string;
  slides: Slide[];
}

export interface Id {
  index: number;
  name: string;
  uuid: string;
}

export interface Color {
  alpha: number;
  blue: number;
  green: number;
  red: number;
}

export interface Slide {
  color: Color;
  enabled: boolean;
  label: string;
  notes: string;
  size: Size | null;
  text: string;
}

export interface Size {
  height: number;
  width: number;
}
