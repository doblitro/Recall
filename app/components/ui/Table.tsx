export type Column<T> = {
  header: string;
  render: (item: T) => React.ReactNode;
};

function Table<T extends { id?: string | null }>({
  items,
  columns,
}: {
  items: T[];
  columns: Column<T>[];
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
          {items.map((item, index) => (
            <tr key={item.id ?? index}>
              {columns.map((column) => (
                <td key={column.header}>{column.render(item)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
