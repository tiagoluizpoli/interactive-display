import './app.css';
import { useEffect, useState } from 'react';
import { type CurrentPresentationDto, socket } from '@/src/socket';

function App() {
  const [currentPresentation, setCurrentPresentation] = useState<CurrentPresentationDto>({
    displayEnabled: false,
  });

  useEffect(() => {
    socket.on('slide', (data: CurrentPresentationDto) => {
      console.log('Slide data:', data);
      setCurrentPresentation(data);
    });
  }, []);

  return (
    <div>
      <Display displayEnabled={currentPresentation.displayEnabled} presentation={currentPresentation.presentation} />
    </div>
  );
}

export default App;

const Display = ({ presentation, displayEnabled }: CurrentPresentationDto) => {
  if (!presentation || !displayEnabled) {
    return <div />;
  }
  return (
    <div id="area" className="visible">
      <div className="content">
        <div className="left">
          <img id="qrcode" src={presentation.qrCodeContent} alt="qrcode" />
          <div className="text-container">
            <h1 id="title">{presentation.title}</h1>
            <p id="description">{presentation.description}</p>
          </div>
        </div>

        <div className="right">
          <img id="banner" src={`http://localhost:5000/${presentation.imageUrl}`} alt="" />
        </div>
      </div>
    </div>
  );
};
