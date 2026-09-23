import webpush from "web-push";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT ?? "mailto:apty@localhost";

/** True once a VAPID keypair is present (see `npm run generate:vapid`). */
export const pushConfigured = Boolean(publicKey && privateKey);

if (pushConfigured) {
  webpush.setVapidDetails(subject, publicKey!, privateKey!);
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

/** Sends a notification to one subscription. Returns false if it's gone (410/404). */
export async function sendToSubscription(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload,
): Promise<boolean> {
  if (!pushConfigured) return false;
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
    );
    return true;
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) return false; // expired — caller should prune
    throw err;
  }
}

export { webpush };
