import { usePresentationConnection } from './presentation-connection';

export const Layout2 = () => {
  const { currentSlide } = usePresentationConnection();

  const { displayEnabled, currentSlide: slide } = currentSlide;

  console.log(slide);
  if (!slide || !displayEnabled) {
    return <div />;
  }

  return (
    <div className="w-screen h-screen flex flex-col justify-end">
      <div className="flex justify-center w-full p-14 bg-[rgba(0,0,0,0.6)] text-white">
        <p className="text-5xl font-bold max-w-4xl text-center">{slide.text}</p>
      </div>
    </div>
  );
};
