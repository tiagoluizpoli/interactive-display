import { usePresentationConnection } from './presentation-connection';

export const Layotut1 = () => {
  const { currentPresentation } = usePresentationConnection();

  const { presentation, displayEnabled } = currentPresentation;
  if (!presentation || !displayEnabled) {
    return <div />;
  }
  return (
    <div className="w-screen h-screen flex flex-col justify-end">
      <div className="bg-black/60 p-8 flex justify-between items-end ">
        <div className="flex items-end gap-4">
          <img id="qrcode" src={presentation.qrCodeContent} alt="qrcode" />
          <div className="text-white">
            <h1 className="text-5xl font-black">{presentation.title}</h1>
            <p className="text-3xl font-light">{presentation.description}</p>
          </div>
        </div>

        <div className="h-48">
          <img id="banner" src={`http://localhost:5000/${presentation.imageUrl}`} alt="" />
        </div>
      </div>
    </div>
  );
};
