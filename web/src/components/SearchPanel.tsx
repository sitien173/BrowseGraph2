import { useState } from "react";
import { GraphResult } from "../types/graph";
import { Search } from "lucide-react";

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
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setError(null);
    try {
      const res = await onSearch(query);
      setResults(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    }
  };

  return (
    <div className="search-panel">
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, url, tag..."
          className="search-input"
        />
        <button type="submit" disabled={isSearching} className="search-button">
          <Search size={16} />
        </button>
      </form>

      {error && <div className="text-danger small">{error}</div>}

      {results && results.nodes.length > 0 && (
        <div className="search-results">
          <h4>Results ({results.nodes.length})</h4>
          <ul className="result-list">
            {results.nodes.slice(0, 10).map(node => (
              <li key={node.id} onClick={() => onSelectNode(node.id)}>
                <div className="result-label">{node.labels.join(" / ")}</div>
                <div className="result-title">
                  {String(node.props.title ?? node.props.name ?? node.props.normalizedUrl ?? node.id)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {results && results.nodes.length === 0 && (
        <div className="search-results">
          <p className="text-muted small">No results found.</p>
        </div>
      )}
    </div>
  );
}
