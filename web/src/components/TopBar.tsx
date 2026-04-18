interface TopBarProps {
  nodeCount: number;
  edgeCount: number;
  isRefreshing: boolean;
  onRefresh: () => Promise<void>;
  onSignOut: () => void;
}

export default function TopBar({
  nodeCount,
  edgeCount,
  isRefreshing,
  onRefresh,
  onSignOut
}: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <h1>Explorer</h1>
        <p>Read-only graph navigation</p>
      </div>
      <div className="topbar-stats">
        <span>{nodeCount} nodes</span>
        <span>{edgeCount} edges</span>
      </div>
      <div className="topbar-actions">
        <button
          type="button"
          onClick={() => void onRefresh()}
          disabled={isRefreshing}
        >
          {isRefreshing ? "Refreshing..." : "Refresh seed"}
        </button>
        <button type="button" className="ghost-button" onClick={onSignOut}>
          Sign out
        </button>
      </div>
    </header>
  );
}
