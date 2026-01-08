import { io } from '@/server';
import { createChildLogger } from './logger';
import { env } from './env';
import type { ConfigType } from './config-validator';

interface NotificationParams {
  broadcastInterval: number;
}

const notificationTypes = [
  // issues
  'config-missing',
  'invalid-config',
  'connection-issue',
  'puppetter-issue',
  'propresenter-issue',

  // other
  'status',
] as const;
export type NotificationType = (typeof notificationTypes)[number];

export interface Notification {
  type: NotificationType;
  layer: ConfigType | 'other';
  context: {
    message: string;
    data?: Record<string, any>;
  };
}

const { broadcastInterval } = env.notifier;

export class Notifier {
  private logger = createChildLogger('Notifier');
  private notifications: Notification[] = [];
  private intervalId: NodeJS.Timeout | undefined;
  private static instance: Notifier | undefined;

  constructor(private readonly notificationParams: NotificationParams) {
    this.startBroadcast();
  }

  public static getInstance() {
    if (!Notifier.instance) {
      Notifier.instance = new Notifier({ broadcastInterval });
    }

    return Notifier.instance;
  }

  addNotification(params: Notification | Notification[]) {
    if (Array.isArray(params)) {
      this.notifications.push(...params);
      return;
    }

    this.notifications.push(params);
  }

  public startBroadcast() {
    this.intervalId = setInterval(() => {
      const notificationsToPush = this.notifications.splice(0, this.notifications.length - 1);

      // const reducedNotifications = notificationsToPush.reduce((acc: Record<string, any>, curr) => {
      //   if (!acc[curr.layer]) {
      //     acc[curr.layer] = {};
      //   }

      //   acc[curr.layer][curr.type] = curr.context;
      //   return acc;
      // }, {});

      const reducedNotifications = notificationsToPush.reduce((acc: Record<string, any>, curr) => {
        if (!acc[curr.layer]) {
          acc[curr.layer] = [];
        }
        acc[curr.layer].push(curr);

        return acc;
      }, {});

      this.logger.info('Broadcasting notifications', { notifications: reducedNotifications });

      io.emit('notification.status', reducedNotifications);
    }, this.notificationParams.broadcastInterval * 1000);
  }

  public destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    Notifier.instance = undefined;
  }
}
