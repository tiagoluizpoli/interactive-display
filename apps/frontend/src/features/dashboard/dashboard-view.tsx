import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { useDashboardSocketConnection } from './use-dashboard-socket-connection';
import { Badge } from '@/src/components/ui/badge';
import { Icon } from '@iconify/react';

export const DashboardView = () => {
  const { holyricsNotifications, proPresenterNotifications } = useDashboardSocketConnection();

  return (
    <div className="gap-4 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Holyrics</CardTitle>
            <Badge variant={'outline'} className="text-muted-foreground px-2 py-1 w-20">
              {holyricsNotifications.items?.active ? (
                <div className="flex gap-1 items-center">
                  <Icon icon={'octicon:dot-16'} className="w-4 h-4 text-green-500 dark:text-green-400" />
                  {'Ativo'}
                </div>
              ) : (
                <div className="flex gap-1 items-center">
                  <Icon icon={'octicon:dot-16'} className="w-4 h-4 text-red-500 dark:text-red-400" />
                  {'Inativo'}
                </div>
              )}
            </Badge>
          </div>
          <CardDescription>Status do Holyrics</CardDescription>
        </CardHeader>
        <CardContent>
          {holyricsNotifications.logs.length > 0 && (
            <p>
              Última atualização:
              {holyricsNotifications.logs[holyricsNotifications.logs.length - 1]?.timestamp?.toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pro Presenter</CardTitle>
            <Badge variant={'outline'} className="text-muted-foreground px-2 py-1 w-20">
              {proPresenterNotifications.items?.active ? (
                <div className="flex gap-1 items-center">
                  <Icon icon={'octicon:dot-16'} className="w-4 h-4 text-green-500 dark:text-green-400" />
                  {'Ativo'}
                </div>
              ) : (
                <div className="flex gap-1 items-center">
                  <Icon icon={'octicon:dot-16'} className="w-4 h-4 text-red-500 dark:text-red-400" />
                  {'Inativo'}
                </div>
              )}
            </Badge>
          </div>
          <CardDescription>Status do Pro Presenter</CardDescription>
        </CardHeader>
        <CardContent>
          {proPresenterNotifications.logs.length > 0 && (
            <p>
              Última atualização:
              {proPresenterNotifications.logs[proPresenterNotifications.logs.length - 1]?.timestamp?.toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
