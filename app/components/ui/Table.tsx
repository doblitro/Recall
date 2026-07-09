import { Fragment } from "react";

export type Column<T> = {
  header: string;
  render: (item: T) => React.ReactNode;
};

function Table<T extends { id?: string | null }>({
  items,
  columns,
  isRowExpanded,
  onRowClick,
  renderDetail,
}: {
  items: T[];
  columns: Column<T>[];
  isRowExpanded?: (item: T) => boolean;
  onRowClick?: (item: T) => void;
  renderDetail?: (item: T) => React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="table w-full">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.header}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const expanded = isRowExpanded?.(item) ?? false;
            return (
              <Fragment key={item.id ?? index}>
                <tr
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                  className={onRowClick ? "cursor-pointer" : undefined}
                >
                  {columns.map((column) => (
                    <td key={column.header}>{column.render(item)}</td>
                  ))}
                </tr>
                {expanded && renderDetail && (
                  <tr>
                    <td colSpan={columns.length}>{renderDetail(item)}</td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
