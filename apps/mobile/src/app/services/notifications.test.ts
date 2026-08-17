import { beforeEach, describe, expect, it, vi } from 'vitest';

const notificationMocks = vi.hoisted(() => ({
  cancelScheduledNotificationAsync: vi.fn(),
  getAllScheduledNotificationsAsync: vi.fn(),
  getNextTriggerDateAsync: vi.fn(),
  getPermissionsAsync: vi.fn(),
  requestPermissionsAsync: vi.fn(),
  scheduleNotificationAsync: vi.fn(),
  setNotificationChannelAsync: vi.fn(),
  setNotificationHandler: vi.fn()
}));

vi.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        notifications: {
          defaultChannel: 'paceframe-reminders'
        }
      }
    }
  }
}));

vi.mock('expo-notifications', () => ({
  AndroidImportance: { DEFAULT: 'default' },
  DEFAULT_ACTION_IDENTIFIER: 'default-action',
  IosAuthorizationStatus: { PROVISIONAL: 'provisional' },
  PermissionStatus: { GRANTED: 'granted', DENIED: 'denied' },
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
  ...notificationMocks
}));

vi.mock('react-native', () => ({
  Platform: { OS: 'ios' }
}));

import {
  cancelMorningNotificationAsync,
  isMorningNotificationResponse,
  syncMorningNotificationAsync
} from './notifications';

const grantedPermission = {
  granted: true,
  canAskAgain: true,
  status: 'granted',
  ios: { status: 'authorized' }
};

describe('morning notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notificationMocks.getAllScheduledNotificationsAsync.mockResolvedValue([]);
    notificationMocks.getPermissionsAsync.mockResolvedValue(grantedPermission);
    notificationMocks.requestPermissionsAsync.mockResolvedValue(grantedPermission);
    notificationMocks.getNextTriggerDateAsync.mockResolvedValue(Date.UTC(2026, 7, 8, 8, 0));
    notificationMocks.scheduleNotificationAsync.mockResolvedValue('morning-request');
  });

  it('uses the safe 8:00 AM default and creates a daily plan notification', async () => {
    const result = await syncMorningNotificationAsync(undefined);

    expect(result.scheduled).toMatchObject({
      wakeTime: '08:00',
      notificationId: 'morning-request'
    });
    expect(notificationMocks.scheduleNotificationAsync).toHaveBeenCalledWith({
      content: {
        title: 'Good morning',
        body: 'Time to schedule your day based on your energy.',
        sound: false,
        data: {
          scope: 'paceframe.morning',
          destination: 'plan',
          wakeTime: '08:00'
        }
      },
      trigger: {
        type: 'daily',
        hour: 8,
        minute: 0,
        channelId: undefined
      }
    });
  });

  it('cancels only the previous morning notification before rescheduling', async () => {
    notificationMocks.getAllScheduledNotificationsAsync.mockResolvedValue([
      {
        identifier: 'morning-old',
        content: {
          data: { scope: 'paceframe.morning', destination: 'plan', wakeTime: '07:00' }
        }
      },
      {
        identifier: 'reminder-keep',
        content: {
          data: { scope: 'paceframe.reminder', reminderId: 'water' }
        }
      }
    ]);

    await syncMorningNotificationAsync('06:30');

    expect(notificationMocks.cancelScheduledNotificationAsync).toHaveBeenCalledWith('morning-old');
    expect(notificationMocks.cancelScheduledNotificationAsync).not.toHaveBeenCalledWith('reminder-keep');
    expect(notificationMocks.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          data: expect.objectContaining({ wakeTime: '06:30' })
        }),
        trigger: expect.objectContaining({ hour: 6, minute: 30 })
      })
    );
  });

  it('reports a denied permission without creating a schedule', async () => {
    notificationMocks.getPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: false,
      status: 'denied',
      ios: { status: 'denied' }
    });

    const result = await syncMorningNotificationAsync('08:00');

    expect(result.permission.granted).toBe(false);
    expect(result.scheduled).toBeNull();
    expect(notificationMocks.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('recognizes only the default action for the dedicated morning payload', async () => {
    expect(
      isMorningNotificationResponse({
        actionIdentifier: 'default-action',
        notification: {
          request: {
            content: {
              data: { scope: 'paceframe.morning', destination: 'plan', wakeTime: '08:00' }
            }
          }
        }
      } as never)
    ).toBe(true);

    expect(
      isMorningNotificationResponse({
        actionIdentifier: 'default-action',
        notification: {
          request: {
            content: {
              data: { scope: 'paceframe.reminder', reminderId: 'water' }
            }
          }
        }
      } as never)
    ).toBe(false);
  });

  it('can remove every existing morning request', async () => {
    notificationMocks.getAllScheduledNotificationsAsync.mockResolvedValue([
      {
        identifier: 'morning-one',
        content: { data: { scope: 'paceframe.morning', destination: 'plan', wakeTime: '08:00' } }
      },
      {
        identifier: 'morning-two',
        content: { data: { scope: 'paceframe.morning', destination: 'plan', wakeTime: '08:00' } }
      }
    ]);

    await cancelMorningNotificationAsync();

    expect(notificationMocks.cancelScheduledNotificationAsync).toHaveBeenCalledWith('morning-one');
    expect(notificationMocks.cancelScheduledNotificationAsync).toHaveBeenCalledWith('morning-two');
  });
});
