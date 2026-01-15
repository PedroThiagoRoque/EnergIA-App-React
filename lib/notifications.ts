import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Check if we're running in Expo Go, where notifications have limitations
function isExpoGo(): boolean {
  return Constants.executionEnvironment === 'storeClient';
}

// We avoid importing expo-notifications at top-level and also avoid loading it
// in Expo Go where it causes errors. Only load in development builds or standalone apps.
let Notifications: typeof import('expo-notifications') | null = null;
async function ensureNotifications() {
  if (isExpoGo()) {
    console.log('🚫 Notifications disabled in Expo Go. Use a development build for full functionality.');
    return null;
  }

  if (!Notifications) {
    try {
      Notifications = await import('expo-notifications');
    } catch (err) {
      console.log('Failed to load expo-notifications:', err);
      return null;
    }
  }
  return Notifications;
}
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'dailyNotificationId';
const ANDROID_CHANNEL_ID = 'daily-reminder';

type Time = { hour: number; minute: number };

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;

  try {
    const n = await ensureNotifications();
    if (!n) return; // Skip in Expo Go

    await n.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Daily reminders',
      importance: n.AndroidImportance.DEFAULT,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
  } catch (err) {
    console.log('Failed to create notification channel', err);
  }
}

export async function requestPermissions() {
  try {
    const n = await ensureNotifications();
    if (!n) return false; // Skip in Expo Go

    const existing = await n.getPermissionsAsync();
    // existing.granted is boolean on most platforms
    if (existing.granted) return true;

    // iOS can return provisional authorization under existing.ios.status
    if (existing.ios && existing.ios.status === n.IosAuthorizationStatus.PROVISIONAL) return true;

    const result = await n.requestPermissionsAsync();
    if (result.granted) return true;
    if (result.ios && result.ios.status === n.IosAuthorizationStatus.PROVISIONAL) return true;
    return false;
  } catch (err) {
    console.log('Permission request failed', err);
    return false;
  }
}

export async function scheduleDailyNotificationAt(time: Time, options?: { title?: string; body?: string }) {
  try {
    const n = await ensureNotifications();
    if (!n) return null; // Skip in Expo Go

    await ensureAndroidChannel();

    // Cancel any previous scheduled notification to avoid duplicates
    // await cancelScheduledNotification(); // MODIFIED: Don't cancel here if we are scheduling multiple

    const content = {
      title: options?.title ?? 'Lembrete diário',
      body: options?.body ?? 'Abra o app para ver novidades e continuar sua jornada energética.',
      sound: 'default' as any,
    };

    const trigger = {
      hour: time.hour,
      minute: time.minute,
      repeats: true,
    } as any;

    const id = await n.scheduleNotificationAsync({ content, trigger });
    await AsyncStorage.setItem(STORAGE_KEY, id);
    console.log('Scheduled daily notification', id, time);
    return id;
  } catch (err) {
    console.log('Failed to schedule daily notification', err);
    return null;
  }
}

export async function scheduleToastNotifications(toasts: string[], time: Time = { hour: 9, minute: 0 }) {
  try {
    const n = await ensureNotifications();
    if (!n) return;

    await ensureAndroidChannel();

    // Cancel all previously scheduled notifications
    await n.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log('Cancelled all previous notifications');

    // Schedule up to 5 toasts for the next 5 days
    const limit = Math.min(toasts.length, 5);

    for (let i = 0; i < limit; i++) {
      const toast = toasts[i];

      const content = {
        title: 'Dica do dia',
        body: toast,
        sound: 'default' as any,
      };

      // Calculate trigger date: Today + (i + 1) days
      const triggerDate = new Date();
      triggerDate.setDate(triggerDate.getDate() + (i + 1));
      triggerDate.setHours(time.hour, time.minute, 0, 0);

      const trigger = {
        date: triggerDate,
      } as any;

      const id = await n.scheduleNotificationAsync({ content, trigger });
      console.log(`Scheduled toast for ${triggerDate.toISOString()}: ${toast}`);
    }

  } catch (err) {
    console.log('Failed to schedule toast batch:', err);
  }
}

export async function cancelScheduledNotification() {
  try {
    const n = await ensureNotifications();
    if (!n) {
      // In Expo Go, just clear the storage key
      await AsyncStorage.removeItem(STORAGE_KEY);
      return;
    }

    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    if (existing) {
      await n.cancelScheduledNotificationAsync(existing);
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log('Cancelled scheduled notification', existing);
    }
  } catch (err) {
    console.log('Failed to cancel scheduled notification', err);
  }
}

export async function initializeNotifications(defaultTime: Time = { hour: 16, minute: 35 }) {
  try {
    // Load notifications module and set handler (moved from top-level to avoid side-effects)
    const n = await ensureNotifications();
    if (!n) {
      console.log('Notifications not available in Expo Go - skipping initialization');
      return null;
    }

    n.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      console.log('Notifications permission not granted');
      return;
    }

    await ensureAndroidChannel();

    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    if (existing) {
      // already scheduled
      console.log('Daily notification already scheduled:', existing);
      return existing;
    }

    const id = await scheduleDailyNotificationAt(defaultTime);
    return id;
  } catch (err) {
    console.log('initializeNotifications error', err);
  }
}

// Optional helper to read the stored scheduled id
export async function getScheduledNotificationId() {
  return AsyncStorage.getItem(STORAGE_KEY);
}

// Note: notification handler is set during initializeNotifications to avoid
// calling native APIs at module import time when running inside Expo Go.

export default {
  initializeNotifications,
  scheduleDailyNotificationAt,
  cancelScheduledNotification,
  requestPermissions,
  getScheduledNotificationId,
};
