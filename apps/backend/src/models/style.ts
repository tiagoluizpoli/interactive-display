export const types = ['music', 'bible'] as const;
export type Type = (typeof types)[number];

export interface StyleTarget {
  id: string;
  type: Type;
  target: string;
  description?: string;
}

export interface Style {
  id: string;
  name: string;
  type: Type;
}

export interface StyleTargetValue {
  id: string;
  styleId: string;
  targetId: string;
  classes: string;
}

export interface StyleDetails extends Style {
  targets: Omit<StyleTargetValue, 'styleId'>[];
}

export interface InsertStyle extends Omit<Style, 'id'> {
  targets: Omit<StyleTargetValue, 'id' | 'styleId'>[];
}

export interface UpdateStyle extends Style {
  targets: Omit<StyleTargetValue, 'id' | 'styleId'>[];
}
