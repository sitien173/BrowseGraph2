import { useState } from "react";
import { GraphResult } from "../types/graph";
import { Search, X } from "lucide-react";

interface SearchPanelProps {
  onSearch: (query: string) => Promise<GraphResult>;
  onSelectNode: (nodeId: string) => void;
  isSearching: boolean;
}

export default function SearchPanel({
  onSearch,
  onSelectNode,
  isSearching
}: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GraphResult | null>(null);
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const [lastFocusedNodeLabel, setLastFocusedNodeLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setResults(null);
      setLastQuery(null);
      setLastFocusedNodeLabel(null);
      setError(null);
      return;
    }
    
    setError(null);
    try {
      const res = await onSearch(trimmedQuery);
      setResults(res);
      setLastQuery(trimmedQuery);
      setLastFocusedNodeLabel(null);
    } catch (err) {
      setResults(null);
      setLastQuery(trimmedQuery);
      setLastFocusedNodeLabel(null);
      setError(err instanceof Error ? err.message : "Search failed");
    }
  };

  const dismissResults = () => {
    setResults(null);
    setLastQuery(null);
  };

  const handleSelectNode = (nodeId: string, label: string) => {
    onSelectNode(nodeId);
    setLastFocusedNodeLabel(label);
    setResults(null);
    setLastQuery(null);
    setQuery("");
    setError(null);
  };

  return (
    <div className="search-panel">
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length === 0) {
              setResults(null);
              setLastQuery(null);
              setError(null);
            }
          }}
          placeholder="SEARCH_NODES..."
          className="search-input"
        />
        <button
          type="submit"
          disabled={isSearching || query.trim().length === 0}
          className="search-button"
          title="Execute Search"
        >
          <Search size={14} />
        </button>
      </form>

      {error && <div className="search-error">ERR: {error}</div>}
      {isSearching && <div className="search-status">EXECUTING_QUERY...</div>}
      {lastFocusedNodeLabel && (
        <div className="search-status">NAVIGATED TO: {lastFocusedNodeLabel}</div>
      )}

      {results && results.nodes.length > 0 && (
        <div className="search-results">
          <div className="results-header">
            <span>SELECT NODE TO RECENTER ({results.nodes.length})</span>
            <button type="button" className="search-results-dismiss" onClick={dismissResults}>
              <X size={12} />
            </button>
          </div>
          <ul className="result-list">
            {results.nodes.slice(0, 10).map(node => (
              <li
                key={node.id}
                onClick={() =>
                  handleSelectNode(
                    node.id,
                    String(node.props.title ?? node.props.name ?? node.props.normalizedUrl ?? node.id)
                  )
                }
              >
                <span className="result-label">{node.labels[0] || "NODE"}</span>
                <span className="result-title" title={String(node.props.title ?? node.props.name ?? node.props.normalizedUrl ?? node.id)}>
                  {String(node.props.title ?? node.props.name ?? node.props.normalizedUrl ?? node.id)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {results && results.nodes.length === 0 && (
        <div className="search-results empty">
          NO_MATCHES: "{lastQuery ?? query.trim()}"{" "}
          <button type="button" className="search-inline-button" onClick={dismissResults}>
            CLOSE
          </button>
        </div>
      )}
    </div>
  );
}
