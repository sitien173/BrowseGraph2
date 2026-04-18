interface ErrorBannerProps {
  error: string;
  onDismiss?: () => void;
}

export default function ErrorBanner({ error, onDismiss }: ErrorBannerProps) {
  return (
    <div className="error-banner">
      <p>{error}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="ghost-button btn-small">
          Dismiss
        </button>
      )}
    </div>
  );
}
