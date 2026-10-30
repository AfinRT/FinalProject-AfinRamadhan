const alignmentClasses = {
  left: "data-table-header-cell",
  center: "data-table-header-cell-center",
  right: "data-table-header-cell-right",
};

export function TableHeader({ columns }) {
  return (
    <thead className="data-table-head">
      <tr>
        {columns.map((column) => (
          <th
            className={alignmentClasses[column.align] || alignmentClasses.left}
            key={column.key}
            scope="col"
          >
            {column.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function TableBody({
  loading,
  data,
  columnsCount,
  loadingText,
  emptyText,
  renderRow,
}) {
  if (loading) {
    return (
      <tbody className="data-table-body">
        <tr>
          <td className="data-table-state" colSpan={columnsCount}>
            {loadingText}
          </td>
        </tr>
      </tbody>
    );
  }

  if (data.length === 0) {
    return (
      <tbody className="data-table-body">
        <tr>
          <td className="data-table-empty" colSpan={columnsCount}>
            {emptyText}
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody className="data-table-body">
      {data.map((item, index) => renderRow(item, index))}
    </tbody>
  );
}
