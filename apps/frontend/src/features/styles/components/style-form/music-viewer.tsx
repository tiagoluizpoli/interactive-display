import type { UseFormWatch } from 'react-hook-form';
import type { TargetListItem, UpsertStyle } from '../../core';

const fields = ['container', 'text-container', 'text'] as const;
type Field = (typeof fields)[number];

interface Props {
  watch: UseFormWatch<UpsertStyle>;
  targets: TargetListItem[];
}
export const MusicViewer = ({ watch, targets }: Props) => {
  const styles = watch('targets');

  const classes = targets.reduce(
    (acc: Record<Field, string>, curr) => {
      acc[curr.target as Field] = styles.find((i) => i.targetId === curr.id)?.classes ?? '';
      return acc;
    },
    {} as Record<Field, string>,
  );

  return (
    <div id="container" className={classes.container}>
      <div id="text-container" className={classes['text-container']}>
        <p id="text" className={classes.text}>
          E nele meu prazer está
        </p>
      </div>
    </div>
  );
};
