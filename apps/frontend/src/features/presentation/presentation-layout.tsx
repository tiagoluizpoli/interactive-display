import { AnimatePresence, motion } from 'framer-motion';
import { type BibleSlide, type Slide, usePresentationConnection } from './presentation-connection';
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

  return (
    <MotionWrapper key={`${slide.text}-${displayEnabled}`}>
      <div id="container" className="w-full p-4 flex justify-center">
        <div
          id="text-container"
          className="w-fit text-5xl font-bold bg-[rgba(0,0,0,0.9)] text-white px-8 py-6 rounded-xl"
        >
          {lines.map((line, index) => (
            <p id="text" key={index}>
              {line}
            </p>
          ))}
        </div>
      </div>
    </MotionWrapper>
  );
};

const BibleView = ({ bibleSlide }: { bibleSlide: BibleSlide }) => {
  return (
    <MotionWrapper key={`${bibleSlide.reference}-${bibleSlide.text}`}>
      
      <div id="container" className="w-full p-4">
        <div
          id="inner-container"
          className="bg-[rgba(0,0,0,0.9)] w-full font-sans flex flex-col items-end gap-2 p-8 rounded-2xl"
        >
          <div id="reference-container" className="flex items-start gap-4 pb-4 mb-2">
            <span id="reference" className="w-fit font-bold text-5xl text-white rounded-xl">
              {bibleSlide.reference}
            </span>
            <span id="version" className="text-2xl font-thin text-white">
              {bibleSlide.version}
            </span>
          </div>
          <div id="text-container" className="w-full">
            <p id="text" className="text-5xl text-white">
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
