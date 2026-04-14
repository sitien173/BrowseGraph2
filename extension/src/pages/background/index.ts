import {
  getSettings,
  performSync,
  schedulePeriodicSync,
  SYNC_ALARM_NAME
} from "../../services/sync";
import {
  closeCurrentSession,
  configureIdleDetection,
  startSession
} from "../../services/session";

interface RuntimeMessage {
  type?: string;
}

const MANUAL_SYNC_MESSAGE = "browsegraph.syncNow";
let currentSync: Promise<void> | null = null;

const logSyncFailure = (error: unknown): void => {
  console.warn("BrowseGraph sync failed.", { error });
};

const runSync = (): void => {
  if (currentSync !== null) {
    return;
  }

  currentSync = performSync();
  void currentSync
    .catch(logSyncFailure)
    .finally(() => {
      currentSync = null;
    });
};

const initializeBackground = (): void => {
  configureIdleDetection();
  void startSession();
  void getSettings().then((settings) =>
    schedulePeriodicSync(settings.syncIntervalMinutes)
  );
};

chrome.runtime.onInstalled.addListener((): void => {
  console.info("BrowseGraph background service worker installed.");
  initializeBackground();
  runSync();
});

chrome.runtime.onStartup.addListener((): void => {
  initializeBackground();
  runSync();
});

chrome.runtime.onSuspend.addListener((): void => {
  void closeCurrentSession(new Date().toISOString());
});

chrome.idle.onStateChanged.addListener((state): void => {
  if (state === "idle" || state === "locked") {
    void closeCurrentSession(new Date().toISOString());
    return;
  }

  void startSession();
});

chrome.alarms.onAlarm.addListener((alarm): void => {
  if (alarm.name === SYNC_ALARM_NAME) {
    runSync();
  }
});

chrome.tabs.onCreated.addListener((): void => {
  runSync();
});

chrome.tabs.onUpdated.addListener((): void => {
  runSync();
});

chrome.tabs.onRemoved.addListener((): void => {
  runSync();
});

chrome.tabGroups.onCreated.addListener((): void => {
  runSync();
});

chrome.tabGroups.onUpdated.addListener((): void => {
  runSync();
});

chrome.tabGroups.onRemoved.addListener((): void => {
  runSync();
});

chrome.bookmarks.onCreated.addListener((): void => {
  runSync();
});

chrome.bookmarks.onChanged.addListener((): void => {
  runSync();
});

chrome.bookmarks.onRemoved.addListener((): void => {
  runSync();
});

chrome.bookmarks.onMoved.addListener((): void => {
  runSync();
});

chrome.runtime.onMessage.addListener(
  (message: RuntimeMessage, _sender, sendResponse): boolean => {
    if (message.type !== MANUAL_SYNC_MESSAGE) {
      return false;
    }

    performSync()
      .then(() => sendResponse({ ok: true }))
      .catch((error: unknown) => {
        logSyncFailure(error);
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Sync failed"
        });
      });

    return true;
  }
);
