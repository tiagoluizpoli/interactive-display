import type { Presentation } from './presentation';

export interface CurrentPresentationDto {
  presentation?: Presentation | null;
  displayEnabled?: boolean;
}

export class CurrentPresentation {
  presentation?: Presentation | null;
  displayEnabled?: boolean;

  constructor(presentation?: Presentation | null, displayEnabled?: boolean) {
    this.presentation = presentation;
    this.displayEnabled = displayEnabled;
  }

  public setPresentation(presentation: Presentation | null): void {
    this.presentation = presentation;
  }

  public setDisplayEnabled(displayEnabled: boolean): void {
    this.displayEnabled = displayEnabled;
  }

  public toJSON(): CurrentPresentationDto {
    return {
      presentation: this.presentation,
      displayEnabled: this.displayEnabled,
    };
  }
}
