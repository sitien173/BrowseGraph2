import { GraphResult } from "../types/graph";

export type ApiErrorCode =
  | "invalid_key"
  | "backend_unavailable"
  | "http_error";

export class ApiRequestError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status?: number
  ) {
    super(message);
  }
}

const normalizeBackendUrl = (backendUrl: string): string =>
  backendUrl.trim().replace(/\/+$/, "");

export const getEmbeddedBackendUrl = (): string => window.location.origin;

const fetchWithAuth = async <T>(
  backendUrl: string,
  path: string,
  apiKey: string
): Promise<T> => {
  let response: Response;

  try {
    response = await fetch(`${normalizeBackendUrl(backendUrl)}${path}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });
  } catch {
    throw new ApiRequestError(
      "backend_unavailable",
      "Backend is unavailable. Check that the backend is running and reachable."
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new ApiRequestError(
      "invalid_key",
      "API key was rejected. Paste a valid key and try again.",
      response.status
    );
  }

  if (response.status >= 500) {
    throw new ApiRequestError(
      "backend_unavailable",
      "Backend responded with a server error. Try again in a moment.",
      response.status
    );
  }

  if (!response.ok) {
    const responseBody = await response.text();

    throw new ApiRequestError(
      "http_error",
      `Request failed (${response.status}): ${responseBody}`,
      response.status
    );
  }

  return response.json() as Promise<T>;
};

export const fetchSeedGraph = async (
  apiKey: string,
  backendUrl: string = getEmbeddedBackendUrl()
): Promise<GraphResult> => {
  return fetchWithAuth<GraphResult>(backendUrl, "/api/v1/web/seed", apiKey);
};

export const fetchNeighborhood = async (
  apiKey: string,
  nodeId: string,
  depth: number = 2,
  limit: number = 100,
  backendUrl: string = getEmbeddedBackendUrl()
): Promise<GraphResult> => {
  return fetchWithAuth<GraphResult>(
    backendUrl,
    `/api/v1/graph/neighborhood/${encodeURIComponent(nodeId)}?depth=${depth}&limit=${limit}`,
    apiKey
  );
};

export const fetchFilteredGraph = async (
  apiKey: string,
  filters: { tag?: string; domain?: string; type?: string; session?: string },
  backendUrl: string = getEmbeddedBackendUrl()
): Promise<GraphResult> => {
  const params = new URLSearchParams();
  if (filters.tag) params.append("tag", filters.tag);
  if (filters.domain) params.append("domain", filters.domain);
  if (filters.type) params.append("type", filters.type);
  if (filters.session) params.append("session", filters.session);
  
  return fetchWithAuth<GraphResult>(
    backendUrl,
    `/api/v1/graph/filter?${params.toString()}`,
    apiKey
  );
};

export const fetchSearchNodes = async (
  apiKey: string,
  query: string,
  limit: number = 20,
  backendUrl: string = getEmbeddedBackendUrl()
): Promise<GraphResult> => {
  const params = new URLSearchParams({ q: query, limit: limit.toString() });
  return fetchWithAuth<GraphResult>(
    backendUrl,
    `/api/v1/graph/search?${params.toString()}`,
    apiKey
  );
};
