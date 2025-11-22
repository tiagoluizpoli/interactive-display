import { createBrowserRouter, Outlet } from 'react-router';
import { Layout } from '../layout';
import { DashboardView, Presentation } from '@/src/features';

export const layoutRouteNames = {
  baseRoute: '/',
  presentation: '/presentation',
};

function App() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export const router = createBrowserRouter([
  {
    path: layoutRouteNames.baseRoute,
    element: <App />,
    children: [
      {
        index: true,
        element: <DashboardView />,
      },
    ],
  },

  {
    path: layoutRouteNames.presentation,
    element: <Presentation />,
  },
]);
