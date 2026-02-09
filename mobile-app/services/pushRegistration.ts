import { PushNotifications, type PushToken } from "@/lib/pushNotifications";

export async function registerPushTokenForUser(
  userId?: string | null,
): Promise<PushToken | null> {
  if (!userId) return null;

  const tokenInfo = await PushNotifications.registerForPushNotifications();
  if (!tokenInfo?.token) return null;

  await PushNotifications.savePushToken(userId, tokenInfo.token);
  return tokenInfo;
}
