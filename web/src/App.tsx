import { useEffect, useMemo, useState } from "react";

import AuthScreen from "./components/AuthScreen";
import ExplorerShell from "./components/ExplorerShell";
import {
  ApiRequestError,
  fetchSeedGraph,
  getEmbeddedBackendUrl
} from "./lib/api";
import { GraphResult } from "./types/graph";
import { clearStoredApiKey, getStoredApiKey, storeApiKey } from "./lib/storage";

const EMPTY_GRAPH: GraphResult = { nodes: [], edges: [] };

const toUiErrorMessage = (error: unknown): string => {
  if (error instanceof ApiRequestError) {
    if (error.code === "invalid_key") {
      return "Invalid API key. Paste a valid key and try again.";
    }

    if (error.code === "backend_unavailable") {
      return "Backend unavailable. Confirm the backend is running and reachable.";
    }

    return error.message;
  }

  return "Unexpected error while talking to the backend.";
};

export default function App() {
  const backendUrl = useMemo(() => getEmbeddedBackendUrl(), []);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [pendingApiKey, setPendingApiKey] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [seedError, setSeedError] = useState<string | null>(null);
  const [graph, setGraph] = useState<GraphResult>(EMPTY_GRAPH);
  const [isCheckingStoredKey, setIsCheckingStoredKey] = useState(true);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [isLoadingSeed, setIsLoadingSeed] = useState(false);

  const loadSeed = async (key: string): Promise<void> => {
    setIsLoadingSeed(true);
    setSeedError(null);

    try {
      const seedGraph = await fetchSeedGraph(key, backendUrl);
      setGraph(seedGraph);
    } finally {
      setIsLoadingSeed(false);
    }
  };

  const connectWithKey = async (key: string): Promise<void> => {
    setIsSubmittingAuth(true);
    setAuthError(null);
    setPendingApiKey(key);

    try {
      await loadSeed(key);
      storeApiKey(key);
      setApiKey(key);
    } catch (error) {
      setAuthError(toUiErrorMessage(error));
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleReloadSeed = async (): Promise<void> => {
    if (apiKey === null) {
      return;
    }

    try {
      await loadSeed(apiKey);
    } catch (error) {
      setSeedError(toUiErrorMessage(error));
    }
  };

  const handleSignOut = (): void => {
    clearStoredApiKey();
    setApiKey(null);
    setPendingApiKey("");
    setAuthError(null);
    setSeedError(null);
    setGraph(EMPTY_GRAPH);
  };

  useEffect(() => {
    const tryStoredKey = async (): Promise<void> => {
      const storedApiKey = getStoredApiKey();

      if (storedApiKey === null) {
        setIsCheckingStoredKey(false);
        return;
      }

      setApiKey(storedApiKey);
      setPendingApiKey(storedApiKey);

      try {
        await loadSeed(storedApiKey);
        setIsCheckingStoredKey(false);
      } catch (error) {
        clearStoredApiKey();
        setApiKey(null);
        setPendingApiKey("");
        setGraph(EMPTY_GRAPH);
        setAuthError(
          `Saved key could not be used. ${toUiErrorMessage(error)}`
        );
        setIsCheckingStoredKey(false);
      }
    };

    void tryStoredKey();
  }, [backendUrl]);

  if (isCheckingStoredKey) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <p className="auth-kicker">Auth // Local Storage</p>
          <h1>BrowseGraph</h1>
          <div className="auth-loading">Checking saved API key...</div>
        </section>
      </main>
    );
  }

  if (apiKey === null) {
    return (
      <AuthScreen
        backendUrl={backendUrl}
        initialApiKey={pendingApiKey}
        onApiKeyChange={setPendingApiKey}
        errorMessage={authError}
        isSubmitting={isSubmittingAuth}
        onConnect={connectWithKey}
      />
    );
  }

  return (
    <ExplorerShell
      apiKey={apiKey}
      backendUrl={backendUrl}
      seedGraph={graph}
      isLoadingSeed={isLoadingSeed}
      loadErrorMessage={seedError}
      onReloadSeed={handleReloadSeed}
      onSignOut={handleSignOut}
    />
  );
}
