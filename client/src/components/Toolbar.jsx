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
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      <select value={type} onChange={(e) => onTypeChange(e.target.value)}>
        <option value="">All types</option>
        <option value="image">Images</option>
        <option value="video">Videos</option>
        <option value="document">Documents</option>
        <option value="other">Other</option>
      </select>

      <select value={sortBy} onChange={(e) => onSortByChange(e.target.value)}>
        <option value="date">Date</option>
        <option value="name">Name</option>
        <option value="size">Size</option>
      </select>

      <button
        className="icon-button toolbar-sort-order"
        title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
        onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
      >
        <i className={`fa-solid ${sortOrder === 'asc' ? 'fa-arrow-up-wide-short' : 'fa-arrow-down-wide-short'}`} />
      </button>

      <div className="toolbar-view-toggle">
        <button
          className={view === 'list' ? 'active' : ''}
          title="List view"
          onClick={() => onViewChange('list')}
        >
          <i className="fa-solid fa-list" />
        </button>
        <button
          className={view === 'grid' ? 'active' : ''}
          title="Grid view"
          onClick={() => onViewChange('grid')}
        >
          <i className="fa-solid fa-table-cells-large" />
        </button>
      </div>
    </div>
  );
}
