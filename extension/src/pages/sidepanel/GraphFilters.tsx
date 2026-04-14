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

  return (
    <div className="absolute left-0 right-0 bottom-0 z-10 p-2 pointer-events-none">
      <div className={`mx-auto max-w-sm bg-white shadow-lg border border-gray-200 rounded-lg overflow-hidden pointer-events-auto transition-all duration-300 ${isOpen ? 'h-auto max-h-64' : 'h-10 max-h-10'}`}>
        <header 
          className="h-10 px-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Filters</span>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
        </header>

        {isOpen && (
          <div className="p-4 pt-0 space-y-3 overflow-y-auto max-h-52">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Node Type</label>
              <select 
                value={filters.type} 
                onChange={e => updateFilter("type", e.target.value)}
                className="w-full text-xs border border-gray-200 rounded p-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                {NODE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tag Slug</label>
              <input 
                type="text" 
                value={filters.tag} 
                onChange={e => updateFilter("tag", e.target.value)}
                placeholder="e.g. research"
                className="w-full text-xs border border-gray-200 rounded p-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Domain</label>
              <input 
                type="text" 
                value={filters.domain} 
                onChange={e => updateFilter("domain", e.target.value)}
                placeholder="e.g. github.com"
                className="w-full text-xs border border-gray-200 rounded p-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => onFilterChange({ tag: "", domain: "", type: "", session: "" })}
                className="text-[10px] text-blue-600 font-bold hover:underline"
              >
                Reset All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
