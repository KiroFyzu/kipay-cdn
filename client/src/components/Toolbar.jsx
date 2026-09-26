export default function Toolbar({
  search,
  onSearchChange,
  type,
  onTypeChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  view,
  onViewChange,
}) {
  return (
    <div className="toolbar">
      <input
        className="toolbar-search"
        placeholder="Search files by name…"
        aria-label="Search files by name"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      <select value={type} onChange={(e) => onTypeChange(e.target.value)} aria-label="Filter by file type">
        <option value="">All types</option>
        <option value="image">Images</option>
        <option value="video">Videos</option>
        <option value="document">Documents</option>
        <option value="other">Other</option>
      </select>

      <select value={sortBy} onChange={(e) => onSortByChange(e.target.value)} aria-label="Sort by">
        <option value="date">Date</option>
        <option value="name">Name</option>
        <option value="size">Size</option>
      </select>

      <button
        className="icon-button toolbar-sort-order"
        title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
        aria-label={sortOrder === 'asc' ? 'Sort ascending, click for descending' : 'Sort descending, click for ascending'}
        onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
      >
        <i className={`fa-solid ${sortOrder === 'asc' ? 'fa-arrow-up-wide-short' : 'fa-arrow-down-wide-short'}`} aria-hidden="true" />
      </button>

      <div className="toolbar-view-toggle" role="group" aria-label="Change view">
        <button
          className={view === 'list' ? 'active' : ''}
          title="List view"
          aria-label="List view"
          aria-pressed={view === 'list'}
          onClick={() => onViewChange('list')}
        >
          <i className="fa-solid fa-list" aria-hidden="true" />
        </button>
        <button
          className={view === 'grid' ? 'active' : ''}
          title="Grid view"
          aria-label="Grid view"
          aria-pressed={view === 'grid'}
          onClick={() => onViewChange('grid')}
        >
          <i className="fa-solid fa-table-cells-large" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
