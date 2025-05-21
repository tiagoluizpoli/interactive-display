import { v4 as uuid } from 'uuid';

export interface EntityProps {
  id?: string;
  createdAt?: Date;
}

export abstract class Entity<T> {
  protected readonly _id: string;
  protected readonly _createdAt: Date;
  public readonly props: T;

  get id(): string {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  constructor(props: T, entityProps?: EntityProps) {
    const { id, createdAt } = entityProps ?? {};
    this._id = id ?? uuid();
    this._createdAt = createdAt ?? new Date();
    this.props = props;
  }

  public equals(entity?: Entity<T>): boolean {
    if (entity == null || entity === undefined) {
      return false;
    }

    if (this === entity) {
      return true;
    }

    if (this.constructor !== entity.constructor) {
      return false;
    }

    return this._id === entity._id;
  }

  public toJSON(): object {
    return {
      id: this._id,
      createdAt: this._createdAt,
      ...this.props,
    };
  }
}
