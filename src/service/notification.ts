import * as Notifications from 'expo-notifications';
import { api } from './api';
import { getUserId } from '@/config/supabase';
import { Alert } from 'react-native';

// List of possible times
const NOTIFICATION_TIMES = [
  { hour: 9, minute: 0 },
  { hour: 12, minute: 0 },
  { hour: 15, minute: 0 },
  { hour: 18, minute: 0 },
  { hour: 21, minute: 0 },
];

// Fetch single AI notification
async function fetchAINotificationText() {
  const userId = await getUserId();
  try {
    const res = await api.post(`/get-notification`, { userId });
    return res.data.message; // single string
  } catch (err) {
    console.error('Backend fetch error:', err);
    return "HireKar: Check worker availability today!";
  }
}

// Request permission
export async function requestNotificationPermissions() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Notifications blocked', 'Please enable notifications in your device settings.');
    return false;
  }
  return true;
}

// Notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Schedule a notification at a **random time from the list**
export async function scheduleRandomNotification() {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  // Generate a random index
  const index = Math.floor(Math.random() * NOTIFICATION_TIMES.length);
  const time = NOTIFICATION_TIMES[index];

  const message = await fetchAINotificationText();
  if (!message) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'HireKar Reminder',
      body: message,
    },
    trigger: {
      hour: time.hour,
      minute: time.minute,
      repeats: false, // one-time notification
      type: 'time',
    } as any,
  });

  console.log(`Scheduled one-time notification at ${time.hour}:${time.minute} - ${message}`);
}

// Immediate test notification
export const handleTestNotification = async () => {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const message = await fetchAINotificationText();
  if (!message) return Alert.alert('Error', 'No notification message available.');

  await Notifications.scheduleNotificationAsync({
    content: { title: 'HireKar Test', body: message },
    trigger: null, // immediate
  });

  console.log('Test notification sent:', message);
};