import { DataTableProps } from "../types/TableComponentTypes";
import { PaginationControls } from "./PaginationControls";

export function DataTable<T>({
  title,
  columns,
  data,
  emptyText,
  rowClassName = "hover:bg-light-purple/5 dark:hover:bg-white/5",
  pagination,
}: DataTableProps<T>) {
  return (
    <div className="space-y-4 mb-4">
      <h2 className="text-xl font-bold tracking-tight text-foreground">
        {title}
      </h2>

      <div className="w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm dark:border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 dark:bg-white/5 dark:text-gray-400">
              <tr>
                {columns.map((col, i) => (
                  <th
                    key={i}
                    className="px-6 py-4 font-semibold"
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-white/10">
              {data.length > 0 ? (
                data.map((row, i) => (
                  <tr
                    key={i}
                    className={`group transition-colors ${rowClassName}`}
                  >
                    {columns.map((col, j) => (
                      <td
                        key={j}
                        className={`px-6 py-4 ${col.className ?? ""}`}
                      >
                        {col.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    {emptyText}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination && <PaginationControls {...pagination} />}
      </div>
    </div>
  );
}
