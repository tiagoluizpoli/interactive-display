import { createBrowserRouter } from 'react-router';
import App from '@/src/app';

import { Layotut1 } from '@/src/presentation';

const layoutRouteNames = {
  baseRoute: '/',
  layout1: '/layout-1',
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
]);
