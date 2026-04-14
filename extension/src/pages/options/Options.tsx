import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent, ReactElement } from "react";

import {
  DEFAULT_BACKEND_URL,
  DEFAULT_SYNC_INTERVAL_MINUTES,
  getSettings,
  saveSettings,
  schedulePeriodicSync,
  validateBackendConnection
} from "../../services/sync";

const SYNC_INTERVAL_OPTIONS = [1, 5, 10, 30];

type ConnectionStatus = "idle" | "checking" | "connected" | "error";

interface OptionsFormState {
  backendUrl: string;
  apiKey: string;
  syncIntervalMinutes: number;
}

const initialFormState: OptionsFormState = {
  backendUrl: DEFAULT_BACKEND_URL,
  apiKey: "",
  syncIntervalMinutes: DEFAULT_SYNC_INTERVAL_MINUTES
};

const statusText = (
  connectionStatus: ConnectionStatus,
  errorMessage: string
): string => {
  if (connectionStatus === "checking") {
    return "Checking connection";
  }

  if (connectionStatus === "connected") {
    return "Connected";
  }

  if (connectionStatus === "error") {
    return errorMessage;
  }

  return "Not checked";
};

export function OptionsApp(): ReactElement {
  const [formState, setFormState] =
    useState<OptionsFormState>(initialFormState);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    getSettings()
      .then((settings) => {
        if (isMounted) {
          setFormState(settings);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setConnectionStatus("error");
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to load settings"
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const updateBackendUrl = (event: ChangeEvent<HTMLInputElement>): void => {
    setFormState({ ...formState, backendUrl: event.target.value });
    setConnectionStatus("idle");
  };

  const updateApiKey = (event: ChangeEvent<HTMLInputElement>): void => {
    setFormState({ ...formState, apiKey: event.target.value });
    setConnectionStatus("idle");
  };

  const updateSyncInterval = (event: ChangeEvent<HTMLSelectElement>): void => {
    setFormState({
      ...formState,
      syncIntervalMinutes: Number.parseInt(event.target.value, 10)
    });
    setConnectionStatus("idle");
  };

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setConnectionStatus("checking");
    setErrorMessage("");

    try {
      await validateBackendConnection(formState);
      await saveSettings(formState);
      await schedulePeriodicSync(formState.syncIntervalMinutes);
      setConnectionStatus("connected");
    } catch (error) {
      setConnectionStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save settings"
      );
    }
  };

  return (
    <main className="options-shell">
      <section className="options-panel" aria-labelledby="options-title">
        <p className="eyebrow">BrowseGraph</p>
        <h1 id="options-title">Connection</h1>
        <form onSubmit={submit}>
          <label>
            Backend URL
            <input
              type="url"
              value={formState.backendUrl}
              onChange={updateBackendUrl}
              placeholder={DEFAULT_BACKEND_URL}
              required
            />
          </label>
          <label>
            API key
            <input
              type="password"
              value={formState.apiKey}
              onChange={updateApiKey}
              autoComplete="off"
              required
            />
          </label>
          <label>
            Sync interval
            <select
              value={formState.syncIntervalMinutes}
              onChange={updateSyncInterval}
            >
              {SYNC_INTERVAL_OPTIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} min
                </option>
              ))}
            </select>
          </label>
          <div className={`status status-${connectionStatus}`} role="status">
            {statusText(connectionStatus, errorMessage)}
          </div>
          <button type="submit" disabled={connectionStatus === "checking"}>
            Save
          </button>
        </form>
      </section>
    </main>
  );
}
