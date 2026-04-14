import { getSettings } from "./sync";

export interface GraphNode {
  id: string;
  labels: string[];
  props: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  type: string;
  from: string;
  to: string;
  props: Record<string, any>;
}

export interface GraphResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface NodeWithEdges {
  id: string;
  node: Record<string, any>;
  edges: {
    type: string;
    targetId: string;
    targetLabel: string;
    targetProps: Record<string, any>;
    props: Record<string, any>;
  }[];
}

async function fetchWithAuth(url: string, method: string = "GET", body?: any): Promise<any> {
  const settings = await getSettings();
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${settings.apiKey}`
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

export async function getNeighborhood(nodeId: string, depth: number = 2, limit: number = 200): Promise<GraphResult> {
  const settings = await getSettings();
  const url = `${settings.backendUrl}/api/v1/graph/neighborhood/${nodeId}?depth=${depth}&limit=${limit}`;
  return fetchWithAuth(url);
}

export async function getFilteredGraph(filters: {
  tag?: string;
  domain?: string;
  type?: string;
  session?: string;
}): Promise<GraphResult> {
  const settings = await getSettings();
  const params = new URLSearchParams();
  if (filters.tag) params.append("tag", filters.tag);
  if (filters.domain) params.append("domain", filters.domain);
  if (filters.type) params.append("type", filters.type);
  if (filters.session) params.append("session", filters.session);

  const url = `${settings.backendUrl}/api/v1/graph/filter?${params.toString()}`;
  return fetchWithAuth(url);
}

export async function findNodeByUrl(url: string): Promise<NodeWithEdges | null> {
  const settings = await getSettings();
  const encodedUrl = encodeURIComponent(url);
  const apiUrl = `${settings.backendUrl}/api/v1/nodes/by-url?url=${encodedUrl}`;
  return fetchWithAuth(apiUrl);
}

export async function findNodeById(id: string): Promise<NodeWithEdges | null> {
  const settings = await getSettings();
  const apiUrl = `${settings.backendUrl}/api/v1/nodes/${id}`;
  return fetchWithAuth(apiUrl);
}
