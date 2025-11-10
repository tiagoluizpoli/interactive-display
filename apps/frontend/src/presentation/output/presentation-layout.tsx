import { AnimatePresence, motion } from 'framer-motion';
import { usePresentationConnection, type BibleSlide, type Slide } from './presentation-connection';
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
  if (!slide.text.includes('\n')) {
    return (
      <motion.div
        key={`${slide.text}-${displayEnabled}`}
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        exit={{
          opacity: 0,
        }}
        transition={{ duration: transitionTime }}
        className="flex justify-center items-center w-full p-6"
      >
        <p className="text-5xl font-bold max-w-8xl text-center bg-[rgba(0,0,0,0.8)] text-white p-8 rounded-2xl">
          {slide.text}
        </p>
      </motion.div>
    );
  }

  const lines = slide.text.split('\n');

  return (
    <motion.div
      key={`${slide.text}-${displayEnabled}`}
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
      }}
      transition={{ duration: transitionTime }}
      className="flex justify-center items-center w-full p-6"
    >
      <div className="text-5xl font-bold max-w-8xl text-center bg-[rgba(0,0,0,0.8)] text-white p-8 rounded-2xl">
        {lines.map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </div>
    </motion.div>
  );
};

const BibleView = ({ bibleSlide }: { bibleSlide: BibleSlide }) => {
  return (
    <motion.div
      key={`${bibleSlide.reference}-${bibleSlide.text}`}
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
      <div className="font-bold bg-[rgba(0,0,0,0.8)] w-full font-sans flex flex-col justify-start gap-2 px-8 pb-8">
        <span className="w-fit font-bold text-3xl bg-white p-2 rounded-xl -mt-6">{bibleSlide.reference}</span>
        <p className="text-4xl text-center text-white">{bibleSlide.text}</p>
      </div>
    </motion.div>
  );
};
