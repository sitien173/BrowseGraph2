interface EmptyStateProps {
  title: string;
  message: string;
  isError?: boolean;
}

export default function EmptyState({ title, message, isError }: EmptyStateProps) {
  return (
    <div className={`empty-state-panel ${isError ? 'is-error' : ''}`}>
      <div className="empty-state-icon">{isError ? '!' : 'i'}</div>
      <div className="empty-state-content">
        <h3>{title}</h3>
        <p>{message}</p>
      </div>
    </div>
  );
}
