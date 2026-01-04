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
  useSidebar,
} from '../../components/ui/sidebar';
import { layoutRouteNames } from '@/src/routes';
import { Button } from '@/src/components/ui/button';

import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';

interface MenuItem {
  title: string;
  icon: string;
  to: LinkProps['to'];
  target?: LinkProps['target'];
  copyUrl?: {
    icon: string;
    url: string;
  };
}

interface Group {
  title: string;
  items: MenuItem[];
}

export const AppSidebar = () => {
  const { open } = useSidebar();
  const dashboards: MenuItem[] = [
    {
      title: 'Dashboard',
      to: layoutRouteNames.baseRoute,
      icon: 'ri:dashboard-line',
    },
  ];

  const configs: MenuItem[] = [
    {
      icon: 'mdi:cog-outline',
      title: 'Configurações',
      to: layoutRouteNames.config,
    },
    {
      icon: 'mdi:paint-outline',
      title: 'Estilos',
      to: layoutRouteNames.styles,
    },
  ];

  const telas: MenuItem[] = [
    {
      icon: 'ph:presentation',
      title: 'Apresentação',
      to: layoutRouteNames.presentation,
      target: '_blank',
      copyUrl: {
        icon: 'bx:copy',
        url: `${window.location.origin}${layoutRouteNames.presentation}`,
      },
    },
  ];

  const menuGroups: Group[] = [
    {
      title: 'Home',
      items: dashboards,
    },
    {
      title: 'Configurações',
      items: configs,
    },
    {
      title: 'Telas',
      items: telas,
    },
  ];

  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:p-2!">
              <Link to="/" className="flex items-center flex-col gap-2 h-28">
                <Icon
                  icon={'material-symbols:interactive-space-outline'}
                  className={cn('transition-all duration-200 ease-linear', open ? 'size-14!' : 'size-6!')}
                />

                <span className="text-base font-semibold">Interactive Display</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {menuGroups.map((group, groupIndex) => (
          <SidebarGroup key={`${group.title}.${groupIndex}`}>
            <SidebarGroupLabel> {group.title} </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item, index) => (
                  <SidebarMenuItem key={`${item.title}-${index}`}>
                    <SidebarMenuButton asChild>
                      <Link to={item.to} target={item.target} className="flex items-center justify-between">
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
        ))}
      </SidebarContent>
    </Sidebar>
  );
};
