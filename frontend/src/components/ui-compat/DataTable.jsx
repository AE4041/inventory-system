import { Children, useState } from "react";
import { Spinner } from "@primeicons/react";
import { DataTable as PRDataTable } from "primereact/datatable";
import { cn } from "@/lib/utils";

// v10's <Column field header body/> was a declarative marker read by <DataTable/> itself;
// v11 has no such concept (its DataTable is a fully manual "build the <table> yourself"
// compound API). This keeps Column as the same kind of props-holder marker — it renders
// nothing, DataTable below reads its props directly via Children.toArray.
export function Column() {
  return null;
}

// Compatibility wrapper: keeps the old PrimeReact v10 <DataTable value paginator rows
// totalRecords first lazy onPage loading emptyMessage><Column .../></DataTable> API
// working unchanged for all 18 call sites, backed by v11's compound DataTable.Root.
// Handles both "lazy" (server-paginated, caller supplies totalRecords/first/onPage) and
// plain client-side pagination (caller just passes the full array + rows).
export function DataTable({
  value = [],
  loading = false,
  paginator = false,
  rows = 10,
  totalRecords,
  first = 0,
  lazy = false,
  onPage,
  emptyMessage,
  className,
  children,
}) {
  const columns = Children.toArray(children)
    .filter(Boolean)
    .map((child) => child.props);

  const [internalFirst, setInternalFirst] = useState(0);
  const effectiveFirst = lazy ? first : internalFirst;
  const effectiveTotal = totalRecords ?? value.length;
  const pageRows = lazy ? value : value.slice(effectiveFirst, effectiveFirst + rows);
  const pageCount = Math.max(1, Math.ceil(effectiveTotal / rows));
  const currentPage = Math.floor(effectiveFirst / rows);

  function goToPage(page) {
    const newFirst = page * rows;
    if (lazy) onPage?.({ page, first: newFirst, rows });
    else setInternalFirst(newFirst);
  }

  return (
    <div className={cn("relative", className)}>
      <div className="overflow-x-auto rounded-xl border border-surface-200">
        <PRDataTable.Root value={pageRows} className="w-full">
          <PRDataTable.TableContainer>
            <PRDataTable.Table className="w-full text-sm border-separate border-spacing-0">
              <PRDataTable.THead>
                <PRDataTable.THeadRow>
                  {columns.map((col, i) => (
                    <PRDataTable.THeadCell
                      key={i}
                      className="text-left py-2.5 px-3.5 bg-surface-50 text-[11px] font-semibold uppercase tracking-wide text-surface-500 border-b border-surface-200 whitespace-nowrap"
                    >
                      {col.header}
                    </PRDataTable.THeadCell>
                  ))}
                </PRDataTable.THeadRow>
              </PRDataTable.THead>
              <PRDataTable.TBody>
                {pageRows.map((row, ri) => (
                  <PRDataTable.Row key={row.id ?? ri} className="border-b border-surface-100 last:border-b-0 hover:bg-surface-50 transition-colors">
                    {columns.map((col, ci) => (
                      <PRDataTable.Cell key={ci} className={cn("py-2.5 px-3.5 whitespace-nowrap text-surface-700", col.className)}>
                        {col.body ? col.body(row) : row[col.field]}
                      </PRDataTable.Cell>
                    ))}
                  </PRDataTable.Row>
                ))}
              </PRDataTable.TBody>
              {pageRows.length === 0 && !loading && (
                <PRDataTable.EmptyTBody>
                  <tr>
                    <td colSpan={columns.length || 1} className="text-center py-10">
                      {emptyMessage}
                    </td>
                  </tr>
                </PRDataTable.EmptyTBody>
              )}
            </PRDataTable.Table>
          </PRDataTable.TableContainer>
        </PRDataTable.Root>
        {loading && (
          <div className="flex justify-center py-6">
            <Spinner className="animate-spin size-5 text-surface-400" />
          </div>
        )}
      </div>

      {paginator && effectiveTotal > rows && (
        <div className="flex items-center justify-between pt-3 text-sm text-surface-500">
          <span>
            Page {currentPage + 1} of {pageCount}
          </span>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 0}
              onClick={() => goToPage(currentPage - 1)}
              className="px-3 py-1 rounded-md border border-surface-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-50"
            >
              Prev
            </button>
            <button
              disabled={currentPage >= pageCount - 1}
              onClick={() => goToPage(currentPage + 1)}
              className="px-3 py-1 rounded-md border border-surface-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
