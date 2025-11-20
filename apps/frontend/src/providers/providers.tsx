import { RouterProvider } from 'react-router';
import { router } from '@/src/routes';

import { ThemeProvider } from './theme-provider';
import { SidebarProvider } from '../components/ui/sidebar';

export const Providers = () => {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <RouterProvider router={router} />
      </SidebarProvider>
    </ThemeProvider>
  );
};
