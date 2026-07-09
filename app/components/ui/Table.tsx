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
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-border bg-surface">
            {columns.map((column) => (
              <th
                key={column.header}
                className="px-4 py-2 font-semibold text-muted-foreground"
              >
                {column.header}
              </th>
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
                  className={`border-b border-border last:border-b-0 ${
                    onRowClick ? "cursor-pointer hover:bg-surface-hover" : ""
                  } ${expanded ? "bg-surface-hover" : ""}`}
                >
                  {columns.map((column) => (
                    <td key={column.header} className="px-4 py-2">
                      {column.render(item)}
                    </td>
                  ))}
                </tr>
                {expanded && renderDetail && (
                  <tr className="border-b border-border bg-surface-hover last:border-b-0">
                    <td colSpan={columns.length} className="px-4">
                      {renderDetail(item)}
                    </td>
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
