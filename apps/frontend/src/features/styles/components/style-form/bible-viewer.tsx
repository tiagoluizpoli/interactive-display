import type { UseFormWatch } from 'react-hook-form';
import type { TargetListItem, UpsertStyle } from '../../core';
import { useEffect } from 'react';
const fields = [
  'container',
  'inner-container',
  'reference-container',
  'reference',
  'version',
  'text-container',
  'text',
] as const;
type Field = (typeof fields)[number];

interface Props {
  watch: UseFormWatch<UpsertStyle>;
  targets: TargetListItem[];
}

export const BibleViewer = ({ watch, targets }: Props) => {
  const bibleExample = {
    reference: 'João 20:1',
    version: 'ACF',
    text: 'E no primeiro dia da semana, Maria Madalena foi ao sepulcro de madrugada, sendo ainda escuro, e viu a pedra tirada do sepulcro.',
  };
  const styles = watch('targets');

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.tailwindcss.com';
    script.onload = () => {
      (window as any).tailwind.config = {
        important: '#bible-preview',
        corePlugins: {
          preflight: false,
        },
      };
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const classes = targets.reduce(
    (acc: Record<Field, string>, curr) => {
      acc[curr.target as Field] = styles.find((i) => i.targetId === curr.id)?.classes ?? '';
      return acc;
    },
    {} as Record<Field, string>,
  );
  return (
    <div id="bible-preview">
      <div id="container" className={classes.container}>
        <div id="inner-container" className={classes['inner-container']}>
          <div id="reference-container" className={classes['reference-container']}>
            <span id="reference" className={classes.reference}>
              {bibleExample.reference}
            </span>
            <span id="version" className={classes.version}>
              {bibleExample.version}
            </span>
          </div>
          <div id="text-container" className={classes['text-container']}>
            <p id="text" className={classes.text}>
              {bibleExample.text}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
