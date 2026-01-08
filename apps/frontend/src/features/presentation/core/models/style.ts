export interface StyleClassResult {
  target: {
    id: string;
    name: string;
    description?: string;
  };
  classes: string;
}
export interface StyleResult {
  id: string;
  name: string;
  type: 'bible' | 'music';
  classes: StyleClassResult[];
}

export interface Style {
  name: string;
  type: 'bible' | 'music';
}

export interface BibleStyle extends Style {
  classes: {
    container: string;
    'inner-container': string;
    'reference-container': string;
    reference: string;
    version: string;
    'text-container': string;
    text: string;
  };
}

export interface MusicStyle extends Style {
  classes: {
    container: string;
    'text-container': string;
    text: string;
  };
}

export const mapToBibleStyle = (style: StyleResult): BibleStyle => {
  return {
    name: style.name,
    type: style.type,
    classes: style.classes.reduce(
      (acc, curr) => {
        acc[curr.target.name as keyof BibleStyle['classes']] = curr.classes;
        return acc;
      },
      {} as BibleStyle['classes'],
    ),
  };
};

export const mapToMusicStyle = (style: StyleResult): MusicStyle => {
  return {
    name: style.name,
    type: style.type,
    classes: style.classes.reduce(
      (acc, curr) => {
        acc[curr.target.name as keyof MusicStyle['classes']] = curr.classes;
        return acc;
      },
      {} as MusicStyle['classes'],
    ),
  };
};
