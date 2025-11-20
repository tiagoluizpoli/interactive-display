import { Link, type LinkProps } from 'react-router';
import { Icon } from '@iconify/react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../../components/ui/sidebar';
import { layoutRouteNames } from '@/src/routes';
import { Button } from '@/src/components/ui/button';

import { toast } from 'sonner';

interface MenuItem {
  title: string;
  icon: string;
  to: LinkProps['to'];
  copyUrl?: {
    icon: string;
    url: string;
  };
}

export const AppSidebar = () => {
  const menuItems: MenuItem[] = [
    {
      icon: 'ph:presentation',
      title: 'Apresentação',
      to: layoutRouteNames.presentation,
      copyUrl: {
        icon: 'bx:copy',
        url: `${window.location.origin}${layoutRouteNames.presentation}`,
      },
    },
  ];

  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:p-2!">
              <Link to="/" className="flex items-center flex-col gap-2 h-28">
                <Icon icon={'material-symbols:interactive-space-outline'} className="size-14!" />

                <span className="text-base font-semibold">Interactive Display</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel> Telas </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item, index) => (
                <SidebarMenuItem key={`${item.title}-${index}`}>
                  <SidebarMenuButton asChild>
                    <Link to={item.to} target="_blank" className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon icon={item.icon} className="size-4!" />
                        {item.title}
                      </div>
                      {item.copyUrl ? (
                        <Button
                          onClick={(e) => {
                            e.preventDefault();
                            navigator.clipboard.writeText(item.copyUrl!.url);
                            toast.info('Link copiado!');
                          }}
                          type="button"
                          variant="ghost"
                          className="cursor-pointer"
                        >
                          <Icon icon={item.copyUrl.icon} className="size-4!" />
                        </Button>
                      ) : null}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
