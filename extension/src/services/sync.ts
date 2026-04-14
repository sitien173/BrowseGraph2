import { captureBrowserState } from "./capture";
import {
  enqueueRetryPayload,
  getRetryQueue,
  removeRetryQueueEntry
} from "./retry-queue";
import type {
  BookmarkNode,
  CapturedState,
  SyncPayload,
  TabGroupNode,
  TabNode
} from "../types/nodes";

export const DEFAULT_BACKEND_URL = "http://localhost:3000";
export const DEFAULT_SYNC_INTERVAL_MINUTES = 5;
export const SYNC_ALARM_NAME = "browsegraph-periodic-sync";

const SETTINGS_STORAGE_KEY = "settings";
const SNAPSHOT_STORAGE_KEY = "lastKnownState";
const LAST_SYNC_STORAGE_KEY = "lastSyncTimestamp";

export interface ExtensionSettings {
  backendUrl: string;
  apiKey: string;
  syncIntervalMinutes: number;
}

interface StoredSnapshotItem {
  hash: string;
}

interface SnapshotState {
  [key: string]: StoredSnapshotItem;
}

interface ExtensionStorage {
  settings?: Partial<ExtensionSettings>;
  lastKnownState?: SnapshotState;
  lastSyncTimestamp?: string;
}

interface SyncResponseBody {
  timestamp: string;
}

const getStorage = (
  keys: (keyof ExtensionStorage)[]
): Promise<ExtensionStorage> => chrome.storage.local.get(keys);

const setStorage = (items: ExtensionStorage): Promise<void> =>
  chrome.storage.local.set(items);

const normalizeBackendUrl = (backendUrl: string): string =>
  backendUrl.trim().replace(/\/+$/, "");

const getHeaders = (apiKey: string): HeadersInit => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${apiKey}`
});

const getSettingsStorage = async (): Promise<ExtensionStorage> =>
  getStorage([SETTINGS_STORAGE_KEY]);

export async function getSettings(): Promise<ExtensionSettings> {
  const storage = await getSettingsStorage();
  const settings = storage.settings;

  return {
    backendUrl: normalizeBackendUrl(settings?.backendUrl ?? DEFAULT_BACKEND_URL),
    apiKey: settings?.apiKey ?? "",
    syncIntervalMinutes:
      settings?.syncIntervalMinutes ?? DEFAULT_SYNC_INTERVAL_MINUTES
  };
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  await setStorage({
    settings: {
      backendUrl: normalizeBackendUrl(settings.backendUrl),
      apiKey: settings.apiKey,
      syncIntervalMinutes: settings.syncIntervalMinutes
    }
  });
}

export async function validateBackendConnection(
  settings: ExtensionSettings
): Promise<void> {
  const backendUrl = normalizeBackendUrl(settings.backendUrl);
  const response = await fetch(`${backendUrl}/api/v1/health`);

  if (!response.ok) {
    const responseBody = await response.text();

    throw new Error(
      `Health check failed for ${backendUrl}/api/v1/health: ${response.status} ${responseBody}`
    );
  }
}

const requireApiKey = (settings: ExtensionSettings): void => {
  if (settings.apiKey.trim().length === 0) {
    throw new Error("BrowseGraph API key is required before syncing.");
  }
};

const postJson = async (
  url: string,
  settings: ExtensionSettings,
  body: object
): Promise<Response> => {
  const response = await fetch(url, {
    method: "POST",
    headers: getHeaders(settings.apiKey),
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const responseBody = await response.text();

    throw new Error(`POST ${url} failed: ${response.status} ${responseBody}`);
  }

  return response;
};

export async function sendSyncPayload(
  nodes: SyncPayload[],
  settings: ExtensionSettings
): Promise<SyncResponseBody | null> {
  if (nodes.length === 0) {
    return null;
  }

  requireApiKey(settings);

  const backendUrl = normalizeBackendUrl(settings.backendUrl);
  const response = await postJson(`${backendUrl}/api/v1/nodes/sync`, settings, {
    nodes
  });

  return response.json() as Promise<SyncResponseBody>;
}

const generateEdges = async (
  settings: ExtensionSettings,
  sinceTimestamp: string
): Promise<void> => {
  const backendUrl = normalizeBackendUrl(settings.backendUrl);

  await postJson(`${backendUrl}/api/v1/edges/generate`, settings, {
    since: sinceTimestamp
  });
};

const tabHash = (tab: TabNode): string =>
  JSON.stringify({
    url: tab.url,
    normalizedUrl: tab.normalizedUrl,
    title: tab.title,
    status: tab.status,
    windowId: tab.windowId,
    groupId: tab.groupId,
    position: tab.position
  });

const bookmarkHash = (bookmark: BookmarkNode): string =>
  JSON.stringify({
    chromeId: bookmark.chromeId,
    url: bookmark.url,
    normalizedUrl: bookmark.normalizedUrl,
    title: bookmark.title,
    folderPath: bookmark.folderPath
  });

const tabGroupHash = (tabGroup: TabGroupNode): string =>
  JSON.stringify({
    chromeGroupId: tabGroup.chromeGroupId,
    title: tabGroup.title,
    color: tabGroup.color,
    windowId: tabGroup.windowId,
    collapsed: tabGroup.collapsed
  });

const payloadKey = (payload: SyncPayload): string => {
  if (payload.type === "tab") {
    return `tab:${payload.data.normalizedUrl}`;
  }

  if (payload.type === "bookmark") {
    return `bookmark:${payload.data.chromeId}`;
  }

  if (payload.type === "tabgroup") {
    return `tabgroup:${payload.data.chromeGroupId}`;
  }

  return `session:${payload.data.startedAt}`;
};

const payloadHash = (payload: SyncPayload): string => {
  if (payload.type === "tab") {
    return tabHash(payload.data);
  }

  if (payload.type === "bookmark") {
    return bookmarkHash(payload.data);
  }

  if (payload.type === "tabgroup") {
    return tabGroupHash(payload.data);
  }

  return JSON.stringify(payload.data);
};

const toPayloads = (state: CapturedState): SyncPayload[] => [
  ...state.tabGroups.map(
    (tabGroup): SyncPayload => ({ type: "tabgroup", data: tabGroup })
  ),
  ...state.tabs.map((tab): SyncPayload => ({ type: "tab", data: tab })),
  ...state.bookmarks.map(
    (bookmark): SyncPayload => ({ type: "bookmark", data: bookmark })
  )
];

const getChangedPayloads = (
  payloads: SyncPayload[],
  snapshot: SnapshotState
): SyncPayload[] =>
  payloads.filter((payload) => {
    const key = payloadKey(payload);
    const hash = payloadHash(payload);

    return snapshot[key]?.hash !== hash;
  });

const mergeSnapshot = (
  snapshot: SnapshotState,
  payloads: SyncPayload[]
): SnapshotState =>
  payloads.reduce<SnapshotState>(
    (nextSnapshot, payload) => ({
      ...nextSnapshot,
      [payloadKey(payload)]: { hash: payloadHash(payload) }
    }),
    { ...snapshot }
  );

const drainRetryQueue = async (settings: ExtensionSettings): Promise<void> => {
  const queue = await getRetryQueue();

  for (const entry of queue) {
    console.warn("Retrying queued BrowseGraph sync payload.", {
      retryEntryId: entry.id,
      queuedAt: entry.createdAt,
      nodeCount: entry.nodes.length
    });
    await sendSyncPayload(entry.nodes, settings);
    await generateEdges(settings, entry.createdAt);
    await removeRetryQueueEntry(entry.id);
  }
};

export async function performSync(): Promise<void> {
  const settings = await getSettings();
  const storage = await getStorage([SNAPSHOT_STORAGE_KEY, LAST_SYNC_STORAGE_KEY]);
  const previousSnapshot = storage.lastKnownState ?? {};
  const previousSyncTimestamp =
    storage.lastSyncTimestamp ?? new Date(0).toISOString();

  await drainRetryQueue(settings);

  const state = await captureBrowserState();
  const payloads = toPayloads(state);
  const changedPayloads = getChangedPayloads(payloads, previousSnapshot);

  if (changedPayloads.length === 0) {
    return;
  }

  try {
    const result = await sendSyncPayload(changedPayloads, settings);
    await generateEdges(settings, previousSyncTimestamp);
    await setStorage({
      lastKnownState: mergeSnapshot(previousSnapshot, changedPayloads),
      lastSyncTimestamp: result?.timestamp ?? new Date().toISOString()
    });
  } catch (error) {
    await enqueueRetryPayload(changedPayloads);
    throw error;
  }
}

export async function schedulePeriodicSync(
  syncIntervalMinutes: number
): Promise<void> {
  await chrome.alarms.clear(SYNC_ALARM_NAME);
  await chrome.alarms.create(SYNC_ALARM_NAME, {
    periodInMinutes: syncIntervalMinutes
  });
}
