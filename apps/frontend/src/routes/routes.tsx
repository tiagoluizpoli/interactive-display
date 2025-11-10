import { createBrowserRouter } from 'react-router';
import App from '@/src/app';

import { Presentation } from '@/src/presentation';

export const layoutRouteNames = {
  baseRoute: '/',
  presentation: '/presentation',
};

export const router = createBrowserRouter([
  {
    path: layoutRouteNames.baseRoute,
    element: <App />,
  },

  {
    path: layoutRouteNames.presentation,
    element: <Presentation />,
  },
]);
