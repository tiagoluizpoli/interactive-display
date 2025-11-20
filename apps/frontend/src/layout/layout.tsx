import { Separator } from '../components/ui/separator';
import { SidebarInset, SidebarTrigger } from '../components/ui/sidebar';
import { ModeToggle } from '../providers/theme-provider';
import { AppSidebar } from './sidebar';
import type { ParentType } from './types';

export const Layout = ({ children }: ParentType) => {
  return (
    <>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 justify-between">
          <div className="flex shrink-0 items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            {/* <Breadcrumbs /> */}
          </div>
          <ModeToggle />
        </header>
        <main className="w-full p-4">{children}</main>
      </SidebarInset>
    </>
  );
};
