import { Link } from 'react-router';
import { layoutRouteNames } from './routes';

function App() {
  return (
    <div className="w-screen h-screen flex justify-center items-center">
      <nav className="flex flex-col gap-2 border-black border-4 shadow-lg rounded-lg p-4">
        <Link
          to={layoutRouteNames.presentation}
          target="_blank"
          className="bg-black text-white font-black font-mono rounded-lg py-2 px-4"
        >
          Presentation
        </Link>
      </nav>
    </div>
  );
}

export default App;
