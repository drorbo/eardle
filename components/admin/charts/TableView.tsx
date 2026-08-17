interface TableViewColumn {
  key: string;
  label: string;
}

interface TableViewProps {
  columns: TableViewColumn[];
  rows: Record<string, string | number>[];
}

export function TableView({ columns, rows }: TableViewProps) {
  return (
    <div className="overflow-x-auto mt-3 border border-border-subtle rounded-lg">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-surface-2 text-text-subtle">
            {columns.map((col) => (
              <th key={col.key} className="text-left px-3 py-2 font-medium">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-border-subtle/50">
              {columns.map((col) => (
                <td key={col.key} className="px-3 py-1.5 text-text-secondary">
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
