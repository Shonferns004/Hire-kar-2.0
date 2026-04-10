import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerDevicePushToken() {
  try {
    // Firebase-backed remote push registration removed from hire app.
    // Local scheduled notifications below still work.
    return null;
  } catch (error) {
    return null;
  }
}

const ENGAGEMENT_PREFIX = "hire-engagement";
const assignmentNotificationIds = new Set<string>();

export async function scheduleRandomEngagementNotification() {
  try {
    const existing = await Notifications.getAllScheduledNotificationsAsync();
    const hasScheduled = existing.some((item) =>
      item.identifier?.startsWith(ENGAGEMENT_PREFIX),
    );

    if (hasScheduled) return;

    const now = Date.now();
    const minMinutes = 6 * 60;
    const maxMinutes = 18 * 60;
    const randomMinutes =
      Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes;
    const triggerAt = new Date(now + randomMinutes * 60 * 1000);

    await Notifications.scheduleNotificationAsync({
      identifier: `${ENGAGEMENT_PREFIX}-${triggerAt.getTime()}`,
      content: {
        title: "Need a hand at home?",
        body: "Open HireKar to book a verified worker in minutes.",
        sound: "default",
      },
      trigger: triggerAt,
    });
  } catch (error) {
    console.log("Scheduling engagement notification failed", error);
  }
}

export async function notifyAssignment(job: {
  id?: string;
  type?: string;
  worker_name?: string;
}) {
  try {
    const assignmentKey = job?.id ? `assigned-${job.id}` : undefined;

    if (assignmentKey && assignmentNotificationIds.has(assignmentKey)) {
      return;
    }

    const serviceName = job?.type ? job.type.toUpperCase() : "SERVICE";
    const workerName = job?.worker_name ? ` ${job.worker_name}` : "";

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Worker assigned",
        body: `Your ${serviceName} request is assigned${workerName}.`,
        sound: "default",
      },
      trigger: null,
    });

    if (assignmentKey) {
      assignmentNotificationIds.add(assignmentKey);
    }
  } catch (error) {
    console.log("Assignment notification failed", error);
  }
}
