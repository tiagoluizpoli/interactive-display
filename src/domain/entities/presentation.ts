import { Entity, type EntityProps } from './base';

export interface PresentationProps {
  code: string;
  title: string;
  description: string;
  qrCodeContent: string;
  imageUrl: string;
  enabled: boolean;
}

export class Presentation extends Entity<PresentationProps> {
  private constructor(props: PresentationProps, entityProps?: EntityProps) {
    super(props, entityProps);
  }
  get code(): string {
    return this.props.code;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string {
    return this.props.description;
  }

  get qrCodeContent(): string {
    return this.props.qrCodeContent;
  }

  get imageUrl(): string {
    return this.props.imageUrl;
  }

  get enabled(): boolean {
    return this.props.enabled;
  }

  public static create(props: PresentationProps, entityProps?: EntityProps): Presentation {
    const presentation = new Presentation(props, entityProps);

    return presentation;
  }
}
