import { usePresentationConnection } from './presentation-connection';

export const Layotut1 = () => {
  const { currentPresentation } = usePresentationConnection();

  const { presentation, displayEnabled } = currentPresentation;
  if (!presentation || !displayEnabled) {
    return <div />;
  }
  return (
    <div className="w-screen h-screen flex flex-col justify-end">
      <div className="flex justify-between items-end ">
        <div className="p-4 ">
          <div className="max-w-4xl flex items-end gap-4 p-8 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl">
            <img id="qrcode" className="w-36" src={presentation.qrCodeContent} alt="qrcode" />
            <div className="text-white">
              <h1 className=" text-5xl font-black">{presentation.title}</h1>
              <p className=" text-3xl">{presentation.description}</p>
            </div>
          </div>
        </div>

        <div className="p-4">
          {presentation.imageUrl && (
            <img
              id="banner"
              className="max-h-[22rem] max-w-[56rem] object-contain rounded-2xl "
              src={`http://localhost:5000/${presentation.imageUrl}`}
              alt=""
            />
          )}
        </div>
      </div>
    </div>
  );
};
