import { RouterProvider } from 'react-router';
import { router } from '@/src/routes';

import { ThemeProvider } from './theme-provider';
import { SidebarProvider } from '../components/ui/sidebar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export const Providers = () => {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SidebarProvider>
          <RouterProvider router={router} />
        </SidebarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};
