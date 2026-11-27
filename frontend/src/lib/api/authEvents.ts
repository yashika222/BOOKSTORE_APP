export type AuthTabEvent =
  | { type: 'logout' }
  | { type: 'expired' }
  | { type: 'session-extended'; expiresAt: string };

const STORAGE_EVENT_KEY = 'bookstore_auth_event';
let activeChannel: BroadcastChannel | null = null;

export function subscribeToAuthTabEvents(
  listener: (event: AuthTabEvent) => void
): () => void {
  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel('bookstore-auth');
    activeChannel = channel;
    channel.onmessage = (message: MessageEvent<unknown>) => {
      const event = message.data as AuthTabEvent;
      if (
        event &&
        (event.type === 'logout' ||
          event.type === 'expired' ||
          (event.type === 'session-extended' && typeof event.expiresAt === 'string'))
      ) {
        listener(event);
      }
    };
    return () => {
      channel.close();
      if (activeChannel === channel) activeChannel = null;
    };
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_EVENT_KEY || !event.newValue) return;
    try {
      const parsed: unknown = JSON.parse(event.newValue);
      if (!parsed || typeof parsed !== 'object') return;
      const authEvent = parsed as AuthTabEvent;
      if (
        authEvent.type === 'logout' ||
        authEvent.type === 'expired' ||
        (authEvent.type === 'session-extended' && typeof authEvent.expiresAt === 'string')
      ) {
        listener(authEvent);
      }
    } catch {
      return;
    }
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}

export function broadcastAuthTabEvent(event: AuthTabEvent): void {
  if (activeChannel) {
    activeChannel.postMessage(event);
    return;
  }
  try {
    localStorage.setItem(STORAGE_EVENT_KEY, JSON.stringify(event));
    localStorage.removeItem(STORAGE_EVENT_KEY);
  } catch {
    // Cross-tab synchronization is best-effort when browser storage is unavailable.
  }
}
