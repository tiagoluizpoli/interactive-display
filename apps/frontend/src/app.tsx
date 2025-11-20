import { Layout } from './layout/layout';

function App() {
  return (
    <Layout>
      <div className="w-full h-full flex justify-center items-center">
        <nav className="flex flex-col gap-2 border-black border-4 shadow-lg rounded-lg p-4">Home</nav>
      </div>
    </Layout>
  );
}

export default App;
