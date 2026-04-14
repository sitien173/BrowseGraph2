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

  useEffect(() => {
    setLoading(true);
    findNodeById(nodeId)
      .then(setData)
      .finally(() => setLoading(false));
  }, [nodeId]);

  if (loading) {
    return (
      <div className="absolute right-0 top-0 bottom-0 w-64 bg-white shadow-lg border-l border-gray-200 p-4 z-20">
        <div className="animate-pulse flex flex-col gap-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { node, edges } = data;
  const title = (node.title || node.name || node.normalizedUrl || node.normalizedHost || "Untitled") as string;
  const url = (node.url || node.normalizedUrl) as string;

  return (
    <div className="absolute right-0 top-0 bottom-0 w-64 bg-white shadow-lg border-l border-gray-200 flex flex-col z-20 overflow-hidden">
      <header className="p-4 border-b border-gray-100 flex justify-between items-start">
        <div className="overflow-hidden">
          <h3 className="text-sm font-bold text-gray-900 truncate" title={title}>{title}</h3>
          {url && <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate block">{url}</a>}
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {node.note && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Note</h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{node.note as string}</p>
          </div>
        )}

        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Relationships</h4>
          <ul className="space-y-1">
            {edges.map((edge, i) => (
              <li key={i} className="text-xs flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-mono">{edge.type}</span>
                <span className="text-gray-700 truncate">{ (edge.targetProps.title || edge.targetProps.name || edge.targetProps.normalizedUrl || "Node") as string }</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <footer className="p-4 border-t border-gray-100 flex gap-2">
        <button
          onClick={onCenter}
          className="flex-1 bg-blue-600 text-white text-xs font-semibold py-2 px-4 rounded hover:bg-blue-700 transition-colors"
        >
          Center Graph
        </button>
        <button
          onClick={onExpand}
          className="flex-1 bg-gray-100 text-gray-700 text-xs font-semibold py-2 px-4 rounded hover:bg-gray-200 transition-colors"
        >
          Expand
        </button>
        {url && (
          <button
            onClick={() => window.open(url, '_blank')}
            className="flex-1 bg-gray-100 text-gray-700 text-xs font-semibold py-2 px-4 rounded hover:bg-gray-200 transition-colors"
          >
            Open URL
          </button>
        )}
      </footer>
    </div>
  );
}
