import { Link, type LinkProps } from 'react-router';
import { Icon } from '@iconify/react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../../components/ui/sidebar';
import { layoutRouteNames } from '@/src/routes';

interface MenuItem {
  title: string;
  icon: string;
  to: LinkProps['to'];
  copyUrl?: string;
}

export const AppSidebar = () => {
  const menuItems: MenuItem[] = [
    {
      icon: 'ph:presentation',
      title: 'Apresentação',
      to: layoutRouteNames.presentation,
    },
  ];

  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel> Telas </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item, index) => (
                <SidebarMenuItem key={`${item.title}-${index}`}>
                  <SidebarMenuButton asChild>
                    <Link to={item.to}>
                      <Icon icon={item.icon} className="size-4!" />
                      {item.title}
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
