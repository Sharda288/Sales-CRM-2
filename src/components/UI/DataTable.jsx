export default function DataTable({ columns, rows, empty = 'No records found.', onRowClick }) {
  return <div className="table-wrap"><table className="data-table"><thead><tr>{columns.map((col) => <th key={col.key}>{col.label}</th>)}</tr></thead><tbody>{rows.length === 0 ? <tr><td colSpan={columns.length} className="empty-cell">{empty}</td></tr> : rows.map((row) => <tr key={row.id} onClick={() => onRowClick?.(row)} className={onRowClick ? 'clickable-row' : ''}>{columns.map((col) => <td key={col.key}>{col.render ? col.render(row) : (row[col.key] || '-')}</td>)}</tr>)}</tbody></table></div>;
}
