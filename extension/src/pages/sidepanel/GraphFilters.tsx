import { useState, type ReactElement } from "react";

interface GraphFiltersProps {
  filters: {
    tag: string;
    domain: string;
    type: string;
    session: string;
  };
  onFilterChange: (filters: {
    tag: string;
    domain: string;
    type: string;
    session: string;
  }) => void;
}

const NODE_TYPES = ["Tab", "Bookmark", "Tag", "Domain", "TabGroup", "Session"];

export function GraphFilters({ filters, onFilterChange }: GraphFiltersProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: string, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onFilterChange({ tag: "", domain: "", type: "", session: "" });
  };

  return (
    <section className={`filters-panel ${isOpen ? "is-open" : ""}`}>
      <button
        type="button"
        className="filters-toggle"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
      >
        <div>
          <p className="panel-kicker">Graph Controls</p>
          <h3>Filters</h3>
        </div>
        <span className="filters-state">{isOpen ? "Hide" : "Show"}</span>
      </button>

      {isOpen && (
        <div className="filters-grid">
          <label className="field compact-field">
            <span>Node type</span>
            <select value={filters.type} onChange={(event) => updateFilter("type", event.target.value)}>
              <option value="">All types</option>
              {NODE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label className="field compact-field">
            <span>Tag slug</span>
            <input
              type="text"
              value={filters.tag}
              onChange={(event) => updateFilter("tag", event.target.value)}
              placeholder="research"
            />
          </label>

          <label className="field compact-field">
            <span>Domain</span>
            <input
              type="text"
              value={filters.domain}
              onChange={(event) => updateFilter("domain", event.target.value)}
              placeholder="github.com"
            />
          </label>

          <button type="button" className="ghost-btn compact-action" onClick={resetFilters}>
            Reset filters
          </button>
        </div>
      )}
    </section>
  );
}
