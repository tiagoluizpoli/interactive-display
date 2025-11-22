import { listenTo } from '@/src/config';
import { useEffect, useMemo, useState } from 'react';
type PossibleValues = string | number | boolean | PossibleValues[] | undefined;
export interface BaseNotification {
  active: boolean;
}
export interface StatusNotification {
  subject: string;
  logs: string[];
  items: Record<string, PossibleValues>;
}

export const useDashboardSocketConnection = () => {
  const [holyricsNotifications, setHolyricsNotifications] = useState<StatusNotification>({
    subject: 'holyrics',
    logs: [],
    items: {},
  });

  useEffect(() => {
    listenTo('notification.status', (data: Record<string, StatusNotification>) => {
      console.log('data e tal', data);
      if (data.holyrics) {
        setHolyricsNotifications((prev) => ({
          ...prev,
          items: data.holyrics.items,
          logs: [...prev.logs, ...data.holyrics.logs],
        }));
      }
    });
  }, []);

  const memoizedValue = useMemo(
    () => ({
      holyricsNotifications,
    }),
    [holyricsNotifications],
  );

  return memoizedValue;
};
