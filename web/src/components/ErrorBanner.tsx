interface ErrorBannerProps {
  error: string;
  source?: string;
  onDismiss?: () => void;
}

export default function ErrorBanner({ error, source, onDismiss }: ErrorBannerProps) {
  if (!error) return null;
  return (
    <div className="error-banner">
      <div className="error-content">
        <span className="error-badge">{source ? source.toUpperCase() : "ERR"}</span>
        <p>{error}</p>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="dismiss-btn">
          ✕
        </button>
      )}
    </div>
  );
}
