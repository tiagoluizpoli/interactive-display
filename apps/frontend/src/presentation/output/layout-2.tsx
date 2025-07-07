import { AnimatePresence, motion } from 'framer-motion';
import { usePresentationConnection } from './presentation-connection';

export const Layout2 = () => {
  const { currentSlide } = usePresentationConnection();
  const { displayEnabled, currentSlide: slide } = currentSlide;

  return (
    <div className="w-screen h-screen flex flex-col justify-end motion-preset-fade-lg">
      <AnimatePresence mode="wait">
        {slide && displayEnabled && (
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
            transition={{ duration: 0.3 }}
            className="flex justify-center items-center w-full p-8"
          >
            <p className="text-5xl font-bold max-w-4xl text-center bg-[rgba(0,0,0,0.6)] text-white p-8 rounded-2xl">
              {slide.text}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // return (
  //   <div className="w-screen h-screen flex flex-col justify-end">
  //     <div className="flex justify-center w-full p-14 bg-[rgba(0,0,0,0.6)] text-white">
  //       <p className="text-5xl font-bold max-w-4xl text-center">{slide.text}</p>
  //     </div>
  //   </div>
  // );
};
