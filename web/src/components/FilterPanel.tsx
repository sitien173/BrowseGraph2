import { useEffect, useMemo, useState } from "react";

interface FilterValueSet {
  tag: string;
  domain: string;
  type: string;
  session: string;
}

interface FilterPanelProps {
  activeFilters: FilterValueSet;
  onApplyFilter: (filters: FilterValueSet) => Promise<void> | void;
  isFiltering: boolean;
}

const normalizeFilters = (filters: FilterValueSet): FilterValueSet => ({
  tag: filters.tag.trim(),
  domain: filters.domain.trim(),
  type: filters.type.trim(),
  session: filters.session.trim()
});

const filtersEqual = (left: FilterValueSet, right: FilterValueSet): boolean =>
  left.tag === right.tag &&
  left.domain === right.domain &&
  left.type === right.type &&
  left.session === right.session;

const isAnyFilterActive = (filters: FilterValueSet): boolean =>
  Boolean(filters.tag || filters.domain || filters.type || filters.session);

export default function FilterPanel({ activeFilters, onApplyFilter, isFiltering }: FilterPanelProps) {
  const [tag, setTag] = useState(activeFilters.tag);
  const [domain, setDomain] = useState(activeFilters.domain);
  const [type, setType] = useState(activeFilters.type);
  const [session, setSession] = useState(activeFilters.session);
  const [applyState, setApplyState] = useState<"idle" | "applying" | "applied" | "error">("idle");
  const [applyMessage, setApplyMessage] = useState<string | null>(null);

  useEffect(() => {
    setTag(activeFilters.tag);
    setDomain(activeFilters.domain);
    setType(activeFilters.type);
    setSession(activeFilters.session);
  }, [activeFilters]);

  const draftFilters = useMemo(
    () => normalizeFilters({ tag, domain, type, session }),
    [tag, domain, type, session]
  );
  const activeNormalized = useMemo(() => normalizeFilters(activeFilters), [activeFilters]);
  const isDirty = !filtersEqual(draftFilters, activeNormalized);
  const hasActiveFilters = isAnyFilterActive(activeNormalized);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty) {
      setApplyState("idle");
      setApplyMessage("No pending filter changes");
      return;
    }
    setApplyState("applying");
    setApplyMessage("Applying filters...");

    try {
      await onApplyFilter(draftFilters);
      setApplyState("applied");
      setApplyMessage("Filters applied to graph");
    } catch (error) {
      setApplyState("error");
      setApplyMessage(error instanceof Error ? error.message : "Filter request failed");
    }
  };

  const handleRevertDraft = () => {
    setTag(activeNormalized.tag);
    setDomain(activeNormalized.domain);
    setType(activeNormalized.type);
    setSession(activeNormalized.session);
    setApplyState("idle");
    setApplyMessage("Draft reverted to active filters");
  };

  const handleResetApplied = async () => {
    const clearedFilters = { tag: "", domain: "", type: "", session: "" };
    setTag("");
    setDomain("");
    setType("");
    setSession("");
    setApplyState("applying");
    setApplyMessage("Removing active filters...");
    try {
      await onApplyFilter(clearedFilters);
      setApplyState("idle");
      setApplyMessage("Graph reset to unfiltered scope");
    } catch (error) {
      setApplyState("error");
      setApplyMessage(error instanceof Error ? error.message : "Failed to remove filters");
    }
  };

  return (
    <form onSubmit={handleApply} className="filter-panel">
      <div className="filter-active-state">
        <div className="filter-active-header">ACTIVE SCOPE</div>
        {hasActiveFilters ? (
          <div className="filter-chip-list">
            {activeNormalized.tag ? <span className="filter-chip">TAG: {activeNormalized.tag}</span> : null}
            {activeNormalized.domain ? <span className="filter-chip">DOMAIN: {activeNormalized.domain}</span> : null}
            {activeNormalized.type ? <span className="filter-chip">TYPE: {activeNormalized.type}</span> : null}
            {activeNormalized.session ? <span className="filter-chip">SESSION: {activeNormalized.session}</span> : null}
          </div>
        ) : (
          <div className="filter-status">STATUS: FULL GRAPH (NO ACTIVE FILTERS)</div>
        )}
      </div>
      <div className="filter-grid">
        <div className="filter-group">
          <label>TAG_SCOPE</label>
          <input type="text" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="*" />
        </div>
        <div className="filter-group">
          <label>DOMAIN_FILTER</label>
          <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="*" />
        </div>
        <div className="filter-group">
          <label>EDGE_TYPE</label>
          <input type="text" value={type} onChange={(e) => setType(e.target.value)} placeholder="*" />
        </div>
        <div className="filter-group">
          <label>SESSION_ID</label>
          <input type="text" value={session} onChange={(e) => setSession(e.target.value)} placeholder="*" />
        </div>
      </div>
      <div className="filter-actions">
        <button type="submit" disabled={isFiltering || applyState === "applying" || !isDirty}>APPLY_DRAFT</button>
        <button type="button" onClick={handleRevertDraft} className="ghost-button" disabled={isFiltering || applyState === "applying" || !isDirty}>
          REVERT_DRAFT
        </button>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={() => void handleResetApplied()}
            className="ghost-button"
            disabled={isFiltering || applyState === "applying"}
          >
            RESET_ACTIVE
          </button>
        ) : null}
      </div>
      {applyMessage && (
        <div className={`filter-status ${applyState === "error" ? "is-error" : ""}`}>
          {applyState === "error" ? `ERR: ${applyMessage}` : `STATUS: ${applyMessage.toUpperCase()}`}
        </div>
      )}
    </form>
  );
}
