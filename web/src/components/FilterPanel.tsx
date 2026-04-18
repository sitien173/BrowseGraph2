import { useState } from "react";

interface FilterPanelProps {
  onApplyFilter: (filters: { tag: string; domain: string; type: string; session: string }) => void;
  isFiltering: boolean;
}

export default function FilterPanel({ onApplyFilter, isFiltering }: FilterPanelProps) {
  const [tag, setTag] = useState("");
  const [domain, setDomain] = useState("");
  const [type, setType] = useState("");
  const [session, setSession] = useState("");

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyFilter({ tag, domain, type, session });
  };

  const handleClear = () => {
    setTag("");
    setDomain("");
    setType("");
    setSession("");
    onApplyFilter({ tag: "", domain: "", type: "", session: "" });
  };

  const hasFilters = tag || domain || type || session;

  return (
    <form onSubmit={handleApply} className="filter-panel">
      <h4>Filters</h4>
      <div className="filter-group">
        <label>Tag</label>
        <input type="text" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="e.g. read-later" />
      </div>
      <div className="filter-group">
        <label>Domain</label>
        <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="e.g. github.com" />
      </div>
      <div className="filter-group">
        <label>Type</label>
        <input type="text" value={type} onChange={(e) => setType(e.target.value)} placeholder="e.g. RELATED" />
      </div>
      <div className="filter-group">
        <label>Session</label>
        <input type="text" value={session} onChange={(e) => setSession(e.target.value)} placeholder="Session ID" />
      </div>
      <div className="filter-actions">
        <button type="submit" disabled={isFiltering}>Apply</button>
        {hasFilters && (
          <button type="button" onClick={handleClear} className="ghost-button" disabled={isFiltering}>
            Clear
          </button>
        )}
      </div>
    </form>
  );
}
