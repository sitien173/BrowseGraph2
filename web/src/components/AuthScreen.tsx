import { FormEvent, useEffect, useState } from "react";

interface AuthScreenProps {
  backendUrl: string;
  initialApiKey: string;
  onApiKeyChange: (value: string) => void;
  errorMessage: string | null;
  isSubmitting: boolean;
  onConnect: (apiKey: string) => Promise<void>;
}

export default function AuthScreen({
  backendUrl,
  initialApiKey,
  onApiKeyChange,
  errorMessage,
  isSubmitting,
  onConnect
}: AuthScreenProps) {
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setApiKey(initialApiKey);
  }, [initialApiKey]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const trimmedApiKey = apiKey.trim();

    if (trimmedApiKey.length === 0) {
      setLocalError("Paste an API key to continue.");
      return;
    }

    setLocalError(null);
    await onConnect(trimmedApiKey);
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="auth-kicker">Auth // Ignition Sequence</p>
        <h1>BrowseGraph</h1>
        <p className="auth-copy">
          Enter your Bearer API key to load a recent seed graph. This key is kept
          only in your browser local storage for this app.
        </p>
        <p className="auth-backend">Target Node: {backendUrl}</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="api-key">API Key</label>
          <textarea
            id="api-key"
            value={apiKey}
            onChange={(event) => {
              const nextApiKey = event.target.value;
              setApiKey(nextApiKey);
              onApiKeyChange(nextApiKey);
              if (localError !== null) {
                setLocalError(null);
              }
            }}
            placeholder="Paste key from /api/v1/auth/keys"
            rows={4}
            autoComplete="off"
            spellCheck={false}
            disabled={isSubmitting}
          />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Authenticating..." : "Initialize Session"}
          </button>
        </form>
        {(localError ?? errorMessage) !== null ? (
          <p className="auth-error">{localError ?? errorMessage}</p>
        ) : null}
      </section>
    </main>
  );
}
