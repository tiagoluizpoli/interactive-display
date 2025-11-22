import { io } from '@/server';
import { createChildLogger } from './logger';
// Assuming ConfigType is 'holyrics' | 'pro-presenter' based on your code

type PossibleValues = string | number | boolean | PossibleValues[] | undefined;

// --- Type Definitions ---

const commonPropTypes = ['active'] as const;
export type CommonPropType = (typeof commonPropTypes)[number];

const holyricsPropTypes = [] as const;
export type HolyricsPropType = (typeof holyricsPropTypes)[number];

// Holyrics Item Type: 'active' is required, specific props are optional
export type HolyricsUnionPropType = Record<CommonPropType, PossibleValues> &
  Partial<Record<Exclude<HolyricsPropType, CommonPropType>, PossibleValues>>;

const propresenterPropTypes = [] as const;
export type ProPresenterPropType = (typeof propresenterPropTypes)[number];

// ProPresenter Item Type: 'active' is required, specific props are optional
export type ProPresenterUnionPropType = Record<CommonPropType, PossibleValues> &
  Partial<Record<Exclude<ProPresenterPropType, CommonPropType>, PossibleValues>>;

interface BaseStatus {
  logs: string[];
}

export interface HolyricsStatus extends BaseStatus {
  subject: 'holyrics';
  items: HolyricsUnionPropType;
}

export interface ProPresenterStatus extends BaseStatus {
  subject: 'pro-presenter';
  items: ProPresenterUnionPropType;
}

export type Status = HolyricsStatus | ProPresenterStatus;

// 1. Define a Map to link keys to types
interface StatusMap {
  holyrics: HolyricsStatus;
  'pro-presenter': ProPresenterStatus;
}

// --- Class Implementation ---

export class StatusNotifier {
  private logger = createChildLogger('StatusNotifier');
  private static instance: StatusNotifier | undefined;
  private intervalId: NodeJS.Timeout | undefined;

  // Use the StatusMap to strictly type the storage
  private statuses: StatusMap;

  private constructor() {
    this.statuses = {
      holyrics: {
        subject: 'holyrics',
        items: {
          active: false,
        },
        logs: [],
      },
      'pro-presenter': {
        subject: 'pro-presenter',
        items: {
          active: false,
        },
        logs: [],
      },
    };

    this.startBroadcast();
  }

  public static getInstance() {
    if (!StatusNotifier.instance) {
      StatusNotifier.instance = new StatusNotifier();
    }
    return StatusNotifier.instance;
  }

  /**
   * K extends keyof StatusMap: K becomes 'holyrics' | 'pro-presenter'
   * items: Partial<StatusMap[K]['items']>: Automatically grabs the correct item type based on K
   */
  setStatus<K extends keyof StatusMap>(subject: K, items: Partial<StatusMap[K]['items']>) {
    // We need to cast 'items' here because TypeScript acts conservatively
    // when merging generic partials into concrete union types.
    const currentStatus = this.statuses[subject];

    this.statuses[subject].items = {
      ...currentStatus.items,
      ...items,
    } as StatusMap[K]['items'];
  }

  addLogs(subject: keyof StatusMap, logs: string[]) {
    this.statuses[subject].logs.push(...logs);
  }

  public sendStatus(status: any) {
    this.logger.info('Sending status', { status });
    io.emit('status.update', status);
  }

  public startBroadcast() {
    this.intervalId = setInterval(() => {
      const notificationsToPush = Object.assign({}, this.statuses);

      this.logger.info('Broadcasting notifications', { notifications: notificationsToPush });

      io.emit('notification.status', notificationsToPush);
      this.clearLogs();
    }, 2 * 1000);
  }

  public destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    StatusNotifier.instance = undefined;
  }

  private clearLogs() {
    // Object.values works, but casting helps TS understand the array content
    const allStatuses = Object.values(this.statuses) as Status[];
    for (const status of allStatuses) {
      status.logs.length = 0;
    }
  }
}
