import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { ReminderItem, ReminderKind } from '@paceframe/shared';

const DEFAULT_CHANNEL_ID = 'paceframe-reminders';
const NOTIFICATION_SCOPE = 'paceframe.reminder';

type ReminderTriggerParts = {
  hour: number;
  minute: number;
};

type PaceframeReminderPayload = {
  scope: typeof NOTIFICATION_SCOPE;
  reminderId: string;
  reminderKind: ReminderKind;
  reminderTime: string;
};

export type NotificationPermissionSnapshot = {
  granted: boolean;
  canAskAgain: boolean;
  status: Notifications.PermissionStatus;
};

export type ReminderScheduleResult = {
  reminderId: string;
  notificationId: string;
  nextTriggerAt: string | null;
};

export type ReminderSyncSummary = {
  permission: NotificationPermissionSnapshot;
  scheduled: ReminderScheduleResult[];
  cancelledReminderIds: string[];
  skippedReminderIds: string[];
};

const extra = (Constants.expoConfig?.extra ?? {}) as {
  notifications?: {
    defaultChannel?: string;
  };
};

let notificationHandlerConfigured = false;
let notificationChannelConfigured = false;

function getDefaultChannelId() {
  return extra.notifications?.defaultChannel || DEFAULT_CHANNEL_ID;
}

function buildReminderBody(reminder: ReminderItem) {
  return reminder.note.trim() || `Time to ${reminder.kind}.`;
}

function parseReminderTime(time: string): ReminderTriggerParts | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return { hour, minute };
}

function buildReminderTrigger(time: string): Notifications.DailyTriggerInput | null {
  const parts = parseReminderTime(time);
  if (!parts) {
    return null;
  }

  return {
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    channelId: Platform.OS === 'android' ? getDefaultChannelId() : undefined,
    hour: parts.hour,
    minute: parts.minute
  };
}

function getPermissionSnapshot(settings: Notifications.NotificationPermissionsStatus): NotificationPermissionSnapshot {
  return {
    granted: settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL,
    canAskAgain: settings.canAskAgain,
    status: settings.status
  };
}

function isReminderPayload(value: unknown): value is PaceframeReminderPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const payload = value as Partial<PaceframeReminderPayload>;
  return payload.scope === NOTIFICATION_SCOPE && typeof payload.reminderId === 'string';
}

function getReminderPayload(request: Notifications.NotificationRequest): PaceframeReminderPayload | null {
  const data = request.content.data;
  return isReminderPayload(data) ? data : null;
}

export function configureNotificationHandler() {
  if (notificationHandlerConfigured) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false
    })
  });

  notificationHandlerConfigured = true;
}

export async function ensureReminderChannelAsync() {
  if (Platform.OS !== 'android' || notificationChannelConfigured) {
    return;
  }

  await Notifications.setNotificationChannelAsync(getDefaultChannelId(), {
    name: 'Paceframe reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 200, 150, 200],
    enableVibrate: true,
    enableLights: true,
    lightColor: '#7FDBFF'
  });

  notificationChannelConfigured = true;
}

export async function getNotificationPermissionsAsync(): Promise<NotificationPermissionSnapshot> {
  return getPermissionSnapshot(await Notifications.getPermissionsAsync());
}

export async function requestNotificationPermissionsAsync(): Promise<NotificationPermissionSnapshot> {
  return getPermissionSnapshot(
    await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: false,
        allowSound: false
      }
    })
  );
}

export async function ensureNotificationPermissionsAsync(requestIfNeeded = true): Promise<NotificationPermissionSnapshot> {
  const current = await getNotificationPermissionsAsync();
  if (current.granted || !requestIfNeeded || !current.canAskAgain) {
    return current;
  }

  return requestNotificationPermissionsAsync();
}

export async function getNextReminderTriggerTimeAsync(reminder: ReminderItem): Promise<Date | null> {
  const trigger = buildReminderTrigger(reminder.time);
  if (!trigger) {
    return null;
  }

  const nextTriggerAt = await Notifications.getNextTriggerDateAsync(trigger);
  return nextTriggerAt ? new Date(nextTriggerAt) : null;
}

export async function getScheduledReminderRequestsAsync() {
  const allRequests = await Notifications.getAllScheduledNotificationsAsync();
  return allRequests.filter((request) => Boolean(getReminderPayload(request)));
}

export async function cancelReminderNotificationAsync(reminderId: string) {
  const requests = await getScheduledReminderRequestsAsync();
  const matchingRequests = requests.filter((request) => getReminderPayload(request)?.reminderId === reminderId);

  await Promise.all(matchingRequests.map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)));
}

export async function cancelDisabledReminderNotificationsAsync(reminders: ReminderItem[]) {
  const enabledReminderIds = new Set(reminders.filter((reminder) => reminder.enabled).map((reminder) => reminder.id));
  const requests = await getScheduledReminderRequestsAsync();
  const cancelledReminderIds = new Set<string>();

  await Promise.all(
    requests.map(async (request) => {
      const payload = getReminderPayload(request);
      if (!payload || enabledReminderIds.has(payload.reminderId)) {
        return;
      }

      cancelledReminderIds.add(payload.reminderId);
      await Notifications.cancelScheduledNotificationAsync(request.identifier);
    })
  );

  return Array.from(cancelledReminderIds);
}

export async function scheduleReminderNotificationAsync(reminder: ReminderItem): Promise<ReminderScheduleResult | null> {
  if (!reminder.enabled) {
    await cancelReminderNotificationAsync(reminder.id);
    return null;
  }

  const trigger = buildReminderTrigger(reminder.time);
  if (!trigger) {
    return null;
  }

  configureNotificationHandler();
  await ensureReminderChannelAsync();
  await cancelReminderNotificationAsync(reminder.id);

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: reminder.title,
      body: buildReminderBody(reminder),
      sound: false,
      data: {
        scope: NOTIFICATION_SCOPE,
        reminderId: reminder.id,
        reminderKind: reminder.kind,
        reminderTime: reminder.time
      } satisfies PaceframeReminderPayload
    },
    trigger
  });

  const nextTriggerAt = await Notifications.getNextTriggerDateAsync(trigger);

  return {
    reminderId: reminder.id,
    notificationId,
    nextTriggerAt: nextTriggerAt ? new Date(nextTriggerAt).toISOString() : null
  };
}

export async function syncReminderNotificationsAsync(
  reminders: ReminderItem[],
  options: {
    requestPermissions?: boolean;
  } = {}
): Promise<ReminderSyncSummary> {
  configureNotificationHandler();
  await ensureReminderChannelAsync();

  const permission = await ensureNotificationPermissionsAsync(options.requestPermissions ?? false);
  const scheduled: ReminderScheduleResult[] = [];
  const skippedReminderIds: string[] = [];
  const cancelledReminderIds = new Set(await cancelDisabledReminderNotificationsAsync(reminders));

  if (!permission.granted) {
    reminders.filter((reminder) => reminder.enabled).forEach((reminder) => skippedReminderIds.push(reminder.id));
    return {
      permission,
      scheduled,
      cancelledReminderIds: Array.from(cancelledReminderIds),
      skippedReminderIds
    };
  }

  for (const reminder of reminders) {
    if (!reminder.enabled) {
      continue;
    }

    const scheduledReminder = await scheduleReminderNotificationAsync(reminder);
    if (!scheduledReminder) {
      skippedReminderIds.push(reminder.id);
      continue;
    }

    scheduled.push(scheduledReminder);
  }

  return {
    permission,
    scheduled,
    cancelledReminderIds: Array.from(cancelledReminderIds),
    skippedReminderIds
  };
}

export async function cancelAllReminderNotificationsAsync() {
  const requests = await getScheduledReminderRequestsAsync();
  await Promise.all(requests.map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)));
}
