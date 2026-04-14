import type {
  BookmarkNode,
  CapturedState,
  TabGroupNode,
  TabNode
} from "../types/nodes";
import { isCapturableUrl, normalizeUrl } from "./url-normalizer";

interface BookmarkFolderContext {
  folderPath: string[];
}

const queryTabs = (): Promise<chrome.tabs.Tab[]> => chrome.tabs.query({});

const queryTabGroups = (): Promise<chrome.tabGroups.TabGroup[]> =>
  chrome.tabGroups.query({});

const getBookmarkTree = (): Promise<chrome.bookmarks.BookmarkTreeNode[]> =>
  chrome.bookmarks.getTree();

const toNullableGroupId = (groupId: number | undefined): number | null => {
  if (groupId === undefined || groupId === chrome.tabs.TAB_ID_NONE) {
    return null;
  }

  return groupId;
};

const toTabNode = (tab: chrome.tabs.Tab, capturedAt: string): TabNode | null => {
  if (!isCapturableUrl(tab.url)) {
    return null;
  }

  return {
    url: tab.url,
    normalizedUrl: normalizeUrl(tab.url),
    title: tab.title ?? tab.url,
    status: tab.status ?? "unknown",
    windowId: tab.windowId,
    groupId: toNullableGroupId(tab.groupId),
    createdAt: capturedAt,
    lastSeenAt: capturedAt,
    embedding: null,
    position: tab.index
  };
};

const toTabGroupNode = (
  tabGroup: chrome.tabGroups.TabGroup,
  capturedAt: string
): TabGroupNode => ({
  chromeGroupId: tabGroup.id,
  title: tabGroup.title ?? "",
  color: tabGroup.color,
  windowId: tabGroup.windowId,
  collapsed: tabGroup.collapsed,
  createdAt: capturedAt
});

const folderPathText = (folderPath: string[]): string => folderPath.join("/");

const flattenBookmarkNode = (
  node: chrome.bookmarks.BookmarkTreeNode,
  context: BookmarkFolderContext,
  capturedAt: string
): BookmarkNode[] => {
  if (node.url !== undefined) {
    if (!isCapturableUrl(node.url)) {
      return [];
    }

    return [
      {
        chromeId: node.id,
        url: node.url,
        normalizedUrl: normalizeUrl(node.url),
        title: node.title,
        folderPath: folderPathText(context.folderPath),
        createdAt: capturedAt,
        embedding: null
      }
    ];
  }

  const nextFolderPath =
    node.title.length > 0
      ? [...context.folderPath, node.title]
      : [...context.folderPath];
  const nextContext: BookmarkFolderContext = { folderPath: nextFolderPath };
  const children = node.children ?? [];

  return children.flatMap((child) =>
    flattenBookmarkNode(child, nextContext, capturedAt)
  );
};

export async function captureTabs(capturedAt: string): Promise<TabNode[]> {
  const tabs = await queryTabs();

  return tabs
    .map((tab) => toTabNode(tab, capturedAt))
    .filter((tab): tab is TabNode => tab !== null);
}

export async function captureTabGroups(
  capturedAt: string
): Promise<TabGroupNode[]> {
  const tabGroups = await queryTabGroups();

  return tabGroups.map((tabGroup) => toTabGroupNode(tabGroup, capturedAt));
}

export async function captureBookmarks(
  capturedAt: string
): Promise<BookmarkNode[]> {
  const tree = await getBookmarkTree();
  const context: BookmarkFolderContext = { folderPath: [] };

  return tree.flatMap((node) => flattenBookmarkNode(node, context, capturedAt));
}

export async function captureBrowserState(): Promise<CapturedState> {
  const capturedAt = new Date().toISOString();
  const [tabs, tabGroups, bookmarks] = await Promise.all([
    captureTabs(capturedAt),
    captureTabGroups(capturedAt),
    captureBookmarks(capturedAt)
  ]);

  return { tabs, tabGroups, bookmarks };
}
