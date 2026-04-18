interface EmptyStateProps {
  title: string;
  message: string;
}

export default function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <div className="panel-empty">
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}
