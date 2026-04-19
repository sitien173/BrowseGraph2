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
        <h1>BROWSEGRAPH</h1>
        <div className="brand-divider" />
        <p>EXPLORER_SESSION</p>
      </div>
      <div className="topbar-stats">
        <div className="stat-pill" title="Total Nodes">
          <span className="stat-label">NODES</span>
          <span>{nodeCount}</span>
        </div>
        <div className="stat-pill" title="Total Edges">
          <span className="stat-label">EDGES</span>
          <span>{edgeCount}</span>
        </div>
      </div>
      <div className="topbar-actions">
        <button
          type="button"
          onClick={() => void onRefresh()}
          disabled={isRefreshing}
          className="refresh-btn"
        >
          {isRefreshing ? "SYNCING..." : "SYNC_SEED"}
        </button>
        <button type="button" className="ghost-button" onClick={onSignOut}>
          TERMINATE
        </button>
      </div>
    </header>
  );
}
