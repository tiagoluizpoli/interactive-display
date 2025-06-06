import { Link } from 'react-router';
import { layoutRouteNames } from './routes';

function App() {
  return (
    <div className="w-screen h-screen flex justify-center items-center">
      <nav className="flex flex-col gap-2 border-cyan-900 border-2 rounded-lg p-4">
        <Link
          to={layoutRouteNames.layout1}
          className="bg-cyan-700 text-white font-black font-mono rounded-lg py-2 px-4"
        >
          Layout 1
        </Link>
        <Link
          to={layoutRouteNames.Layout2}
          className="bg-cyan-700 text-white font-black font-mono rounded-lg py-2 px-4"
        >
          Layout 2
        </Link>
      </nav>
    </div>
  );
}

export default App;
