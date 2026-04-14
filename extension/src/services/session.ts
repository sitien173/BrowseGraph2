import { enqueueRetryPayload } from "./retry-queue";
import { getSettings, sendSyncPayload } from "./sync";
import type { SessionNode } from "../types/nodes";

const CURRENT_SESSION_STORAGE_KEY = "currentSession";
export const SESSION_IDLE_TIMEOUT_SECONDS = 30 * 60;

interface SessionStorage {
  currentSession?: SessionNode;
}

const getStorage = (keys: (keyof SessionStorage)[]): Promise<SessionStorage> =>
  chrome.storage.local.get(keys);

const setStorage = (items: SessionStorage): Promise<void> =>
  chrome.storage.local.set(items);

const removeStorage = (keys: (keyof SessionStorage)[]): Promise<void> =>
  chrome.storage.local.remove(keys);

const syncSession = async (session: SessionNode): Promise<void> => {
  try {
    const settings = await getSettings();
    await sendSyncPayload([{ type: "session", data: session }], settings);
  } catch (error) {
    console.warn("Queueing BrowseGraph session sync after failure.", {
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      error
    });
    await enqueueRetryPayload([{ type: "session", data: session }]);
  }
};

export async function getCurrentSession(): Promise<SessionNode | null> {
  const storage = await getStorage([CURRENT_SESSION_STORAGE_KEY]);

  return storage.currentSession ?? null;
}

export async function startSession(): Promise<SessionNode> {
  const currentSession = await getCurrentSession();

  if (currentSession !== null && currentSession.endedAt === null) {
    return currentSession;
  }

  const session: SessionNode = {
    startedAt: new Date().toISOString(),
    endedAt: null,
    automatic: true
  };

  await setStorage({ currentSession: session });
  await syncSession(session);

  return session;
}

export async function closeCurrentSession(endedAt: string): Promise<void> {
  const currentSession = await getCurrentSession();

  if (currentSession === null || currentSession.endedAt !== null) {
    return;
  }

  const closedSession: SessionNode = {
    ...currentSession,
    endedAt
  };

  await setStorage({ currentSession: closedSession });
  await syncSession(closedSession);
  await removeStorage([CURRENT_SESSION_STORAGE_KEY]);
}

export function configureIdleDetection(): void {
  chrome.idle.setDetectionInterval(SESSION_IDLE_TIMEOUT_SECONDS);
}
