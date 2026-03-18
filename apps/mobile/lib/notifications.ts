import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';

// Configure foreground notification appearance once at module load
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

/**
 * Request permission and return the Expo push token.
 * Returns null on simulators, if permission is denied, or on any error.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Push tokens don't work on simulators — bail early
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenData.data;
}

/**
 * Hook that handles notification taps when the app is backgrounded or closed.
 * Must be called once in the root layout.
 */
export function useNotificationNavigation() {
  const router = useRouter();

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, unknown>;
        const recipeId = data.recipeId as string | undefined;
        const type = data.type as string | undefined;

        if (!recipeId) return;

        if (type === 'new_recipe' || type === 'like') {
          router.push(`/recipe/${recipeId}`);
        } else if (type === 'comment') {
          router.push(`/recipe/${recipeId}/comments`);
        }
      }
    );

    return () => subscription.remove();
  }, [router]);
}
