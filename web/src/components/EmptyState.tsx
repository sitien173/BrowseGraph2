interface EmptyStateProps {
  title: string;
  message: string;
  isError?: boolean;
  contextLabel?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  title,
  message,
  isError,
  contextLabel,
  actionLabel,
  onAction
}: EmptyStateProps) {
  return (
    <div className={`empty-state-panel ${isError ? 'is-error' : ''}`}>
      <div className="empty-state-icon">{isError ? '!' : 'i'}</div>
      <div className="empty-state-content">
        {contextLabel ? <p className="empty-state-context">{contextLabel}</p> : null}
        <h3>{title}</h3>
        <p>{message}</p>
        {actionLabel && onAction ? (
          <button type="button" className="empty-state-action" onClick={onAction}>
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
