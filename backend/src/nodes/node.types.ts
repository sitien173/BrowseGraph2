export interface TabNode {
  url: string;
  normalizedUrl: string;
  title: string;
  status: string;
  windowId: number;
  groupId: number | null;
  createdAt: string;
  lastSeenAt: string;
  embedding: number[] | null;
}

export interface BookmarkNode {
  chromeId: string;
  url: string;
  normalizedUrl: string;
  title: string;
  folderPath: string;
  createdAt: string;
  embedding: number[] | null;
}

export interface TabGroupNode {
  chromeGroupId: number;
  title: string;
  color: string;
  windowId: number;
  collapsed: boolean;
  createdAt: string;
}

export interface TagNode {
  name: string;
  slug: string;
  createdAt: string;
}

export interface DomainNode {
  host: string;
  normalizedHost: string;
  createdAt: string;
}

export interface SessionNode {
  startedAt: string;
  endedAt: string | null;
  automatic: boolean;
}
