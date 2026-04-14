import { performSync, getSettings } from "./sync";
import { isCapturableUrl, normalizeUrl } from "./url-normalizer";

export type SaveReason = "research" | "reference" | "todo" | "other";

export interface ContextDraft {
  note: string;
  tags: string[];
  selectedText?: string;
  saveReason: SaveReason;
}

export interface CurrentTabContext {
  tabId: number;
  title: string;
  url: string;
  normalizedUrl: string;
  nodeId: string;
  note: string;
  tags: string[];
  selectedText: string;
  saveReason: SaveReason;
}

interface GraphNode {
  id: string;
  labels: string[];
  props: Record<string, unknown>;
}

interface GraphResult {
  nodes: GraphNode[];
}

interface EdgeSummary {
  type: string;
  targetLabel: string;
  targetProps: Record<string, unknown>;
  props: Record<string, unknown>;
}

interface NodeWithEdges {
  node: Record<string, unknown>;
  edges: EdgeSummary[];
}

interface SelectionResponse {
  selectedText?: string;
}

const GET_SELECTION_MESSAGE = "GET_SELECTION";

const normalizeBackendUrl = (backendUrl: string): string =>
  backendUrl.trim().replace(/\/+$/, "");

const getHeaders = (apiKey: string): HeadersInit => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${apiKey}`
});

const requireApiKey = (apiKey: string): void => {
  if (apiKey.trim().length === 0) {
    throw new Error("BrowseGraph API key is required before saving context.");
  }
};

const getActiveTab = async (): Promise<chrome.tabs.Tab> => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];

  if (tab === undefined) {
    throw new Error("No active tab was found.");
  }

  if (tab.id === undefined) {
    throw new Error("Active tab has no Chrome tab id.");
  }

  if (!isCapturableUrl(tab.url)) {
    throw new Error("Current tab URL cannot be saved.");
  }

  return tab;
};

const normalizedHost = (normalizedUrl: string): string =>
  normalizedUrl.split(/[/?#]/)[0] ?? normalizedUrl;

const fetchJson = async <T,>(url: string, apiKey: string): Promise<T> => {
  const response = await fetch(url, { headers: getHeaders(apiKey) });

  if (!response.ok) {
    const responseBody = await response.text();

    throw new Error(`GET ${url} failed: ${response.status} ${responseBody}`);
  }

  return response.json() as Promise<T>;
};

const patchJson = async <T,>(
  url: string,
  apiKey: string,
  body: object
): Promise<T> => {
  const response = await fetch(url, {
    method: "PATCH",
    headers: getHeaders(apiKey),
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const responseBody = await response.text();

    throw new Error(`PATCH ${url} failed: ${response.status} ${responseBody}`);
  }

  return response.json() as Promise<T>;
};

const findTabNode = async (
  normalizedUrl: string,
  backendUrl: string,
  apiKey: string
): Promise<GraphNode | null> => {
  const params = new URLSearchParams({
    type: "Tab",
    domain: normalizedHost(normalizedUrl)
  });
  const graph = await fetchJson<GraphResult>(
    `${backendUrl}/api/v1/graph/filter?${params.toString()}`,
    apiKey
  );

  return (
    graph.nodes.find(
      (node) =>
        node.labels.includes("Tab") &&
        typeof node.props.normalizedUrl === "string" &&
        node.props.normalizedUrl === normalizedUrl
    ) ?? null
  );
};

const resolveCurrentTabNode = async (
  normalizedUrl: string,
  backendUrl: string,
  apiKey: string
): Promise<GraphNode> => {
  const existingNode = await findTabNode(normalizedUrl, backendUrl, apiKey);

  if (existingNode !== null) {
    return existingNode;
  }

  await performSync();

  const syncedNode = await findTabNode(normalizedUrl, backendUrl, apiKey);

  if (syncedNode === null) {
    throw new Error(`Tab node was not found after sync: ${normalizedUrl}`);
  }

  return syncedNode;
};

const toText = (value: unknown): string =>
  typeof value === "string" ? value : "";

const toSaveReason = (value: unknown): SaveReason => {
  if (
    value === "research" ||
    value === "reference" ||
    value === "todo" ||
    value === "other"
  ) {
    return value;
  }

  return "reference";
};

const extractTags = (details: NodeWithEdges): string[] =>
  details.edges
    .filter(
      (edge) => edge.type === "TAGGED_WITH" && edge.targetLabel === "Tag"
    )
    .map((edge) => toText(edge.targetProps.name))
    .filter((tag) => tag.length > 0);

export async function loadCurrentTabContext(): Promise<CurrentTabContext> {
  const tab = await getActiveTab();
  const settings = await getSettings();

  requireApiKey(settings.apiKey);

  const backendUrl = normalizeBackendUrl(settings.backendUrl);
  const url = tab.url;

  if (!isCapturableUrl(url)) {
    throw new Error("Current tab URL cannot be saved.");
  }

  const normalizedUrl = normalizeUrl(url);
  const node = await resolveCurrentTabNode(
    normalizedUrl,
    backendUrl,
    settings.apiKey
  );
  const details = await fetchJson<NodeWithEdges>(
    `${backendUrl}/api/v1/nodes/${encodeURIComponent(node.id)}`,
    settings.apiKey
  );

  return {
    tabId: tab.id as number,
    title: tab.title ?? url,
    url,
    normalizedUrl,
    nodeId: node.id,
    note: toText(details.node.note),
    tags: extractTags(details),
    selectedText: toText(details.node.selectedText),
    saveReason: toSaveReason(details.node.saveReason)
  };
}

export async function saveContext(
  nodeId: string,
  draft: ContextDraft
): Promise<Record<string, unknown> | null> {
  const settings = await getSettings();

  requireApiKey(settings.apiKey);

  const backendUrl = normalizeBackendUrl(settings.backendUrl);
  const payload = {
    note: draft.note,
    tags: draft.tags,
    saveReason: draft.saveReason,
    ...(draft.selectedText === undefined ? {} : { selectedText: draft.selectedText })
  };

  return patchJson<Record<string, unknown> | null>(
    `${backendUrl}/api/v1/nodes/${encodeURIComponent(nodeId)}/context`,
    settings.apiKey,
    payload
  );
}

export async function getCurrentSelection(tabId: number): Promise<string> {
  const response = await chrome.tabs.sendMessage<
    { type: typeof GET_SELECTION_MESSAGE },
    SelectionResponse
  >(tabId, { type: GET_SELECTION_MESSAGE });

  return response.selectedText ?? "";
}
