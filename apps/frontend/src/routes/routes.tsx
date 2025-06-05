import { createBrowserRouter } from 'react-router';
import App from '@/src/app';

import { Layotut1, Layout2 } from '@/src/presentation';

const layoutRouteNames = {
  baseRoute: '/',
  layout1: '/layout-1',
  Layotut2: '/layout-2'
};

export const router = createBrowserRouter([
  {
    path: layoutRouteNames.baseRoute,
    element: <App />,
  },
  {
    path: layoutRouteNames.layout1,
    element: <Layotut1 />,
  },
  {
    path: layoutRouteNames.Layotut2,
    element: <Layout2 />
  }
]);
