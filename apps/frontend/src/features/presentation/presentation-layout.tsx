import { AnimatePresence, motion } from 'framer-motion';
import { type BibleSlide, type Slide, usePresentationConnection } from './presentation-connection';
import { mapToBibleStyle, mapToMusicStyle, useGetActiveStyleQuery, type BibleStyle, type MusicStyle } from './core';
const transitionTime = 0.2;

export const Presentation = () => {
  const { currentSlide, bibleSlide } = usePresentationConnection();
  const { displayEnabled, currentSlide: slide } = currentSlide;

  return (
    <div className="w-screen h-screen flex flex-col justify-end motion-preset-fade-lg">
      <AnimatePresence mode="wait">
        {bibleSlide ? (
          <BibleView bibleSlide={bibleSlide} key={`bible-${bibleSlide.reference}-${bibleSlide.text}`} />
        ) : slide && displayEnabled ? (
          <MusicView slide={slide} displayEnabled={displayEnabled} key={`music-${slide.text}-${displayEnabled}`} />
        ) : null}
      </AnimatePresence>
    </div>
  );
};

const MusicView = ({ slide, displayEnabled }: { slide: Slide; displayEnabled: boolean }) => {
  const lines = slide.text.includes('\n') ? slide.text.split('\n') : [slide.text];

  const { data, isLoading } = useGetActiveStyleQuery('music');

  const defaultMusicStyle: MusicStyle = {
    name: 'default-music-style',
    type: 'music',
    classes: {
      container: 'w-full p-4 flex justify-center',
      'text-container': 'w-fit text-5xl font-bold bg-[rgba(0,0,0,0.9)] text-white px-8 py-6 rounded-xl',
      text: 'text-red-500',
    },
  };

  if (isLoading) {
    return null;
  }

  const style = data ? mapToMusicStyle(data) : defaultMusicStyle;

  const { classes } = style;

  return (
    <MotionWrapper key={`${slide.text}-${displayEnabled}`}>
      <div id="container" className={classes.container}>
        <div id="text-container" className={classes['text-container']}>
          {lines.map((line, index) => (
            <p id="text" className={classes.text} key={index}>
              {line}
            </p>
          ))}
        </div>
      </div>
    </MotionWrapper>
  );
};

const BibleView = ({ bibleSlide }: { bibleSlide: BibleSlide }) => {
  const { data, isLoading } = useGetActiveStyleQuery('bible');

  const defaultBibleStyle: BibleStyle = {
    name: 'default-bible-style',
    type: 'bible',
    classes: {
      container: 'w-full p-4',
      'inner-container': 'bg-[rgba(0,0,0,0.9)] w-full font-sans flex flex-col items-end gap-2 p-8 rounded-2xl',
      'reference-container': 'flex justify-end items-start gap-4 pb-4 mb-2',
      reference: 'w-fit font-bold text-5xl rounded-xl',
      version: 'text-2xl font-thin text-white',
      'text-container': 'w-full',
      text: 'text-5xl text-white',
    },
  };

  if (isLoading) {
    return null;
  }

  // const style = defaultBibleStyle;
  const style = data ? mapToBibleStyle(data) : defaultBibleStyle;

  const { classes } = style;

  return (
    <MotionWrapper key={`${bibleSlide.reference}-${bibleSlide.text}`}>
      <div id="container" className={classes.container}>
        <div id="inner-container" className={classes['inner-container']}>
          <div id="reference-container" className={classes['reference-container']}>
            <span id="reference" className={classes.reference}>
              {bibleSlide.reference}
            </span>
            <span id="version" className={classes.version}>
              {bibleSlide.version}
            </span>
          </div>
          <div id="text-container" className={classes['text-container']}>
            <p id="text" className={classes.text}>
              {bibleSlide.text}
            </p>
          </div>
        </div>
      </div>
    </MotionWrapper>
  );
};

const MotionWrapper = ({ children, key }: { children: React.ReactNode; key: string }) => {
  return (
    <motion.div
      key={key}
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
      }}
      transition={{ ease: 'easeInOut', duration: transitionTime }}
      className="flex justify-center items-center w-full"
    >
      {children}
    </motion.div>
  );
};
