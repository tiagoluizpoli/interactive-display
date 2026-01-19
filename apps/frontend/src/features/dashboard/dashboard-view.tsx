import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { useDashboardSocketConnection } from './use-dashboard-socket-connection';
import { Badge } from '@/src/components/ui/badge';
import { Icon } from '@iconify/react';
import { usePresentationConnection } from '../presentation/presentation-connection';

export const DashboardView = () => {
  const { holyricsNotifications, proPresenterNotifications } = useDashboardSocketConnection();
  const { bibleSlide, currentSlide } = usePresentationConnection();

  return (
    <div className="gap-4 grid grid-cols-1 lg:grid-cols-2">
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
          <div className="flex flex-col gap-1">
            {bibleSlide === null ? (
              <p className="font-bold text-xl">Não há um versículo sendo exibido</p>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="w-full flex justify-end gap-1">
                  <p className="font-bold">{bibleSlide.reference}</p>
                  <p className="text-xs">{bibleSlide.version}</p>
                </div>
                <p className="font-thin">{bibleSlide.text}</p>
              </div>
            )}
          </div>
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
          {currentSlide.currentSlide?.text ? (
            <p className="font-thin">{currentSlide.currentSlide?.text}</p>
          ) : (
            <p className="font-bold text-xl">Não há um trecho de música sendo exibido</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
