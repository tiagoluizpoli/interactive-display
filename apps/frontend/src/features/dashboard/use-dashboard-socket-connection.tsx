import { listenTo } from '@/src/config';
import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';

type PossibleValues = string | number | boolean | PossibleValues[] | undefined;

export interface StatusNotifierLogs {
  timestamp: Date;
  message: string;
  context?: Record<string, PossibleValues>;
}

export interface BaseNotification {
  active: boolean;
}

export interface StatusNotification {
  subject: string;
  logs: StatusNotifierLogs[];
  items: Record<string, PossibleValues>;
}

const possibleValuesSchema = z.union([z.string(), z.number(), z.boolean(), z.coerce.date()]);

const statusNotificationSchema = z.object({
  subject: z.string(),
  logs: z.array(
    z.object({
      timestamp: z.coerce.date(),
      message: z.string(),
      context: z.record(z.string(), z.union([possibleValuesSchema, z.array(possibleValuesSchema)])).optional(),
    }),
  ),
  items: z.record(z.string(), z.union([possibleValuesSchema, z.array(possibleValuesSchema)])).optional(),
});

type StatusNotification2 = z.infer<typeof statusNotificationSchema>;

export const useDashboardSocketConnection = () => {
  const [holyricsNotifications, setHolyricsNotifications] = useState<StatusNotification2>({
    subject: 'holyrics',
    logs: [],
    items: {},
  });

  const [proPresenterNotifications, setProPresenterNotifications] = useState<StatusNotification2>({
    subject: 'pro-presenter',
    logs: [],
    items: {},
  });

  useEffect(() => {
    listenTo('notification.status', (data: Record<string, StatusNotification2>) => {
      if (data.holyrics) {
        const parsedData = statusNotificationSchema.safeParse(data.holyrics);

        if (parsedData.success) {
          setHolyricsNotifications((prev) => {
            const last = prev.logs;
            last.push(...parsedData.data.logs);
            return {
              ...prev,
              items: parsedData.data.items,
              logs: last.slice(-100),
            } satisfies StatusNotification2;
          });
        }
      }

      if (data['pro-presenter']) {
        const parsedData = statusNotificationSchema.safeParse(data['pro-presenter']);

        if (parsedData.success) {
          setProPresenterNotifications((prev) => {
            const last = prev.logs;
            last.push(...parsedData.data.logs);
            return {
              ...prev,
              items: parsedData.data.items,
              logs: last.slice(-100),
            } satisfies StatusNotification2;
          });
        }
      }
    });
  }, []);

  const memoizedValue = useMemo(
    () => ({
      holyricsNotifications,
      proPresenterNotifications,
    }),
    [holyricsNotifications, proPresenterNotifications],
  );

  return memoizedValue;
};
