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
        <h1>BrowseGraph</h1>
        <div className="brand-divider" />
        <p>Terminal Session</p>
      </div>
      <div className="topbar-stats">
        <span className="stat-pill"><span className="stat-label">N</span> {nodeCount}</span>
        <span className="stat-pill"><span className="stat-label">E</span> {edgeCount}</span>
      </div>
      <div className="topbar-actions">
        <button
          type="button"
          onClick={() => void onRefresh()}
          disabled={isRefreshing}
        >
          {isRefreshing ? "SYNCING..." : "SYNC SEED"}
        </button>
        <button type="button" className="ghost-button" onClick={onSignOut}>
          TERMINATE
        </button>
      </div>
    </header>
  );
}
