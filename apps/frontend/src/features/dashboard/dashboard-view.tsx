import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { useDashboardSocketConnection } from './use-dashboard-socket-connection';

export const DashboardView = () => {
  const { holyricsNotifications } = useDashboardSocketConnection();
  console.log({ holyricsNotifications });
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Holyrics</CardTitle>
          <CardDescription>Status do Holyrics</CardDescription>
        </CardHeader>
        <CardContent>
          {holyricsNotifications.subject} - {holyricsNotifications.items.active ? 'Ativo' : 'Inativo'}
        </CardContent>
      </Card>
    </div>
  );
};
