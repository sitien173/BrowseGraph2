import { useState } from "react";

interface FilterPanelProps {
  onApplyFilter: (filters: { tag: string; domain: string; type: string; session: string }) => Promise<void> | void;
  isFiltering: boolean;
}

export default function FilterPanel({ onApplyFilter, isFiltering }: FilterPanelProps) {
  const [tag, setTag] = useState("");
  const [domain, setDomain] = useState("");
  const [type, setType] = useState("");
  const [session, setSession] = useState("");
  const [applyState, setApplyState] = useState<"idle" | "applying" | "applied" | "error">("idle");
  const [applyMessage, setApplyMessage] = useState<string | null>(null);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyState("applying");
    setApplyMessage("Applying filters...");

    try {
      await onApplyFilter({
        tag: tag.trim(),
        domain: domain.trim(),
        type: type.trim(),
        session: session.trim()
      });
      setApplyState("applied");
      setApplyMessage("Filters applied");
    } catch (error) {
      setApplyState("error");
      setApplyMessage(error instanceof Error ? error.message : "Filter request failed");
    }
  };

  const handleClear = async () => {
    setTag("");
    setDomain("");
    setType("");
    setSession("");
    setApplyState("applying");
    setApplyMessage("Resetting filters...");
    try {
      await onApplyFilter({ tag: "", domain: "", type: "", session: "" });
      setApplyState("idle");
      setApplyMessage("Filters reset");
    } catch (error) {
      setApplyState("error");
      setApplyMessage(error instanceof Error ? error.message : "Failed to reset filters");
    }
  };

  const hasFilters = tag || domain || type || session;

  return (
    <form onSubmit={handleApply} className="filter-panel">
      <div className="filter-grid">
        <div className="filter-group">
          <label>Tag</label>
          <input type="text" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="*" />
        </div>
        <div className="filter-group">
          <label>Domain</label>
          <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="*" />
        </div>
        <div className="filter-group">
          <label>Edge Type</label>
          <input type="text" value={type} onChange={(e) => setType(e.target.value)} placeholder="*" />
        </div>
        <div className="filter-group">
          <label>Session ID</label>
          <input type="text" value={session} onChange={(e) => setSession(e.target.value)} placeholder="*" />
        </div>
      </div>
      <div className="filter-actions">
        <button type="submit" disabled={isFiltering || applyState === "applying"}>Apply Params</button>
        {hasFilters && (
          <button type="button" onClick={() => void handleClear()} className="ghost-button" disabled={isFiltering || applyState === "applying"}>
            Reset
          </button>
        )}
      </div>
      {applyMessage && (
        <div className={`filter-status ${applyState === "error" ? "is-error" : ""}`}>
          {applyMessage}
        </div>
      )}
    </form>
  );
}
