interface ErrorBannerProps {
  error: string;
  onDismiss?: () => void;
}

export default function ErrorBanner({ error, onDismiss }: ErrorBannerProps) {
  if (!error) return null;
  return (
    <div className="error-banner">
      <div className="error-content">
        <span className="error-badge">ERR</span>
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
