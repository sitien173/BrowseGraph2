import type { SyncPayload } from "../types/nodes";

export const RETRY_QUEUE_STORAGE_KEY = "retryQueue";
const RETRY_QUEUE_CAPACITY = 500;

export interface RetryQueueEntry {
  id: string;
  createdAt: string;
  nodes: SyncPayload[];
}

interface RetryQueueStorage {
  retryQueue?: RetryQueueEntry[];
}

const getStorage = (
  keys: (keyof RetryQueueStorage)[]
): Promise<RetryQueueStorage> => chrome.storage.local.get(keys);

const setStorage = (items: RetryQueueStorage): Promise<void> =>
  chrome.storage.local.set(items);

const removeEntry = (
  queue: RetryQueueEntry[],
  entryId: string
): RetryQueueEntry[] => queue.filter((entry) => entry.id !== entryId);

const trimQueue = (queue: RetryQueueEntry[]): RetryQueueEntry[] => {
  if (queue.length <= RETRY_QUEUE_CAPACITY) {
    return queue;
  }

  return queue.slice(queue.length - RETRY_QUEUE_CAPACITY);
};

export async function getRetryQueue(): Promise<RetryQueueEntry[]> {
  const storage = await getStorage([RETRY_QUEUE_STORAGE_KEY]);

  return storage.retryQueue ?? [];
}

export async function enqueueRetryPayload(
  nodes: SyncPayload[]
): Promise<void> {
  if (nodes.length === 0) {
    return;
  }

  const queue = await getRetryQueue();
  const entry: RetryQueueEntry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    nodes
  };
  const nextQueue = trimQueue([...queue, entry]);

  await setStorage({ retryQueue: nextQueue });
}

export async function removeRetryQueueEntry(entryId: string): Promise<void> {
  const queue = await getRetryQueue();

  await setStorage({ retryQueue: removeEntry(queue, entryId) });
}
