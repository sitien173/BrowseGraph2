import { useEffect, useState, type ReactElement } from "react";
import { findNodeById, type NodeWithEdges } from "../../services/graph-api";

interface NodeDetailProps {
  nodeId: string;
  onClose: () => void;
  onCenter: () => void;
  onExpand: () => void;
}

export function NodeDetail({ nodeId, onClose, onCenter, onExpand }: NodeDetailProps): ReactElement | null {
  const [data, setData] = useState<NodeWithEdges | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    findNodeById(nodeId)
      .then(setData)
      .catch((loadError) => {
        setData(null);
        setError(loadError instanceof Error ? loadError.message : "Failed to load node details");
      })
      .finally(() => setLoading(false));
  }, [nodeId]);

  if (loading) {
    return (
      <aside className="node-detail-drawer" role="status">
        <div className="detail-skeleton" />
        <div className="detail-skeleton" />
        <div className="detail-skeleton large" />
      </aside>
    );
  }

  if (!data) {
    if (error !== null) {
      return (
        <aside className="node-detail-drawer">
          <header className="node-detail-header">
            <div>
              <p className="panel-kicker">Node Details</p>
              <h3>Details unavailable</h3>
            </div>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close details">
              ✕
            </button>
          </header>
          <section className="detail-section">
            <p className="detail-copy">{error}</p>
          </section>
        </aside>
      );
    }

    return null;
  }

  const { node, edges } = data;
  const title = (node.title || node.name || node.normalizedUrl || node.normalizedHost || "Untitled") as string;
  const url = (node.url || node.normalizedUrl) as string;

  return (
    <aside className="node-detail-drawer">
      <header className="node-detail-header">
        <div>
          <p className="panel-kicker">Node Details</p>
          <h3 title={title}>{title}</h3>
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer">
              {url}
            </a>
          )}
        </div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close details">
          ✕
        </button>
      </header>

      {node.note && (
        <section className="detail-section">
          <p className="detail-label">Note</p>
          <p className="detail-copy">{node.note as string}</p>
        </section>
      )}

      <section className="detail-section detail-section-grow">
        <p className="detail-label">Relationships</p>
        <ul className="detail-list">
          {edges.length === 0 ? (
            <li>
              <span>none</span>
              <strong>No direct relationships.</strong>
            </li>
          ) : (
            edges.map((edge, index) => (
              <li key={`${edge.type}-${index}`}>
                <span>{edge.type}</span>
                <strong>
                  {(edge.targetProps.title || edge.targetProps.name || edge.targetProps.normalizedUrl || "Node") as string}
                </strong>
              </li>
            ))
          )}
        </ul>
      </section>

      <footer className="node-detail-actions">
        <button type="button" className="primary-btn" onClick={onCenter}>
          Center
        </button>
        <button type="button" className="ghost-btn" onClick={onExpand}>
          +1 Depth
        </button>
        {url && (
          <button type="button" className="ghost-btn" onClick={() => window.open(url, "_blank")}>
            Open
          </button>
        )}
      </footer>
    </aside>
  );
}
