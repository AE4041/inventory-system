'use client';;
import { cn } from '@/lib/utils';
import { Spinner } from '@primeicons/react/spinner';
import { DataTable as PRDataTable } from 'primereact/datatable';
import * as React from 'react';

function DataTable({
    className,
    ...props
}) {
    return <PRDataTable.Root className={cn('group/datatable relative', className)} {...props} />;
}

function DataTableHeader({
    className,
    ...props
}) {
    return (
        <PRDataTable.Header
            className={cn(
                'py-2 px-3.5 border-b border-surface-200 dark:border-surface-700',
                'bg-surface-0 dark:bg-surface-900',
                'text-surface-700 dark:text-surface-0',
                className
            )}
            {...props} />
    );
}

function DataTableFooter({
    className,
    ...props
}) {
    return (
        <PRDataTable.Footer
            className={cn(
                'py-2 px-3.5 border-b border-surface-200 dark:border-surface-700',
                'bg-surface-0 dark:bg-surface-900',
                'text-surface-700 dark:text-surface-0',
                className
            )}
            {...props} />
    );
}

function DataTableTableContainer({
    className,
    ...props
}) {
    return <PRDataTable.TableContainer className={cn('relative', className)} {...props} />;
}

function DataTableTable({
    className,
    ...props
}) {
    return (
        <PRDataTable.Table
            className={cn('border-spacing-0 w-full border-separate text-sm', className)}
            {...props} />
    );
}

function DataTableTHead({
    className,
    ...props
}) {
    return (
        <PRDataTable.THead
            className={cn(
                'group-data-scrollable/datatable:top-0 group-data-scrollable/datatable:z-[1]',
                className
            )}
            {...props} />
    );
}

function DataTableTHeadRow({
    className,
    ...props
}) {
    return <PRDataTable.THeadRow className={cn('', className)} {...props} />;
}

const DataTableTHeadTitle = PRDataTable.THeadTitle;

function DataTableTHeadCell({
    className,
    frozen,
    ...props
}) {
    return (
        <PRDataTable.THeadCell
            frozen={frozen}
            className={cn(
                'group/th relative py-2 px-3.5 font-semibold text-start transition-colors duration-200',
                'border-b border-surface-200 dark:border-surface-700',
                'bg-surface-0 dark:bg-surface-900',
                'text-surface-700 dark:text-surface-0',
                // sortable (has Sort child)
                'has-data-[part=sort]:cursor-pointer has-data-[part=sort]:select-none',
                'has-data-[part=sort]:focus-visible:outline',
                'has-data-[part=sort]:focus-visible:-outline-offset-1 has-data-[part=sort]:focus-visible:outline-primary',
                // hover when sortable & not currently sorted
                'has-data-[part=sort]:not-has-data-sorted:hover:bg-surface-100 has-data-[part=sort]:not-has-data-sorted:hover:text-surface-800',
                'dark:has-data-[part=sort]:not-has-data-sorted:hover:bg-surface-800 dark:has-data-[part=sort]:not-has-data-sorted:hover:text-surface-0',
                // sorted
                'has-data-sorted:bg-highlight',
                'group-data-[show-gridlines]/datatable:border-e group-data-[show-gridlines]/datatable:border-surface-200 dark:group-data-[show-gridlines]/datatable:border-surface-700 last:border-e-0',
                'group-data-resizable-columns/datatable:box-border group-data-resizable-columns/datatable:overflow-hidden group-data-resizable-columns/datatable:whitespace-nowrap',
                frozen &&
                    cn(
                        'sticky z-[1]',
                        'data-[frozen-edge=left]:shadow-[inset_-1px_0_0_0_rgba(226,232,240,1)] dark:data-[frozen-edge=left]:shadow-[inset_-1px_0_0_0_rgba(39,39,42,1)]',
                        'data-[frozen-edge=right]:shadow-[inset_1px_0_0_0_rgba(226,232,240,1)] dark:data-[frozen-edge=right]:shadow-[inset_1px_0_0_0_rgba(39,39,42,1)]'
                    ),
                // size variants
                'group-data-[size=small]/datatable:py-0.5 group-data-[size=small]/datatable:px-1.5',
                'group-data-[size=large]/datatable:py-3 group-data-[size=large]/datatable:px-4.5',
                className
            )}
            {...props} />
    );
}

function DataTableTBody(
    {
        className,
        ...props
    }
) {
    return <PRDataTable.TBody className={cn('', className)} {...props} />;
}

function DataTableRow({
    className,
    ...props
}) {
    return (
        <PRDataTable.Row
            className={cn(
                'bg-surface-0 dark:bg-surface-900',
                'text-surface-700 dark:text-surface-0',
                // striped
                'group-data-striped-rows/datatable:even:bg-surface-50 dark:group-data-striped-rows/datatable:even:bg-surface-950',
                // selectable cursor
                'group-data-selection-mode/datatable:cursor-pointer',
                // hover
                'group-data-row-hover/datatable:hover:bg-surface-100 group-data-row-hover/datatable:hover:text-surface-800',
                'dark:group-data-row-hover/datatable:hover:bg-surface-800 dark:group-data-row-hover/datatable:hover:text-surface-0',
                'group-data-selection-mode/datatable:hover:bg-surface-100 group-data-selection-mode/datatable:hover:text-surface-800',
                'dark:group-data-selection-mode/datatable:hover:bg-surface-800 dark:group-data-selection-mode/datatable:hover:text-surface-0',
                // selected (highest priority)
                'data-selected:bg-highlight!',
                // row-reorder drop point
                'data-[dragpoint-top]:shadow-[inset_0_2px_0_0_var(--p-primary-color)]',
                'data-[dragpoint-bottom]:shadow-[inset_0_-2px_0_0_var(--p-primary-color)]',
                className
            )}
            {...props} />
    );
}

function DataTableCell({
    className,
    frozen,
    ...props
}) {
    return (
        <PRDataTable.Cell
            frozen={frozen}
            className={cn(
                'text-start py-2 px-3.5 border-b border-surface-200 dark:border-surface-800',
                'group-data-[show-gridlines]/datatable:border-e group-data-[show-gridlines]/datatable:border-surface-200 dark:group-data-[show-gridlines]/datatable:border-surface-800 last:border-e-0',
                'group-data-resizable-columns/datatable:box-border group-data-resizable-columns/datatable:overflow-hidden group-data-resizable-columns/datatable:whitespace-nowrap',
                frozen &&
                    cn(
                        'sticky z-[1] bg-inherit',
                        'data-[frozen-edge=left]:shadow-[inset_-1px_0_0_0_rgba(226,232,240,1)] dark:data-[frozen-edge=left]:shadow-[inset_-1px_0_0_0_rgba(39,39,42,1)]',
                        'data-[frozen-edge=right]:shadow-[inset_1px_0_0_0_rgba(226,232,240,1)] dark:data-[frozen-edge=right]:shadow-[inset_1px_0_0_0_rgba(39,39,42,1)]'
                    ),
                // size variants
                'group-data-[size=small]/datatable:py-0.5 group-data-[size=small]/datatable:px-1.5',
                'group-data-[size=large]/datatable:py-3 group-data-[size=large]/datatable:px-4.5',
                className
            )}
            {...props} />
    );
}

function DataTableEmptyTBody({
    className,
    ...props
}) {
    return <PRDataTable.EmptyTBody className={cn('', className)} {...props} />;
}

function DataTableTFoot({
    className,
    ...props
}) {
    return <PRDataTable.TFoot className={cn('', className)} {...props} />;
}

function DataTableTFootRow({
    className,
    ...props
}) {
    return <PRDataTable.TFootRow className={cn('', className)} {...props} />;
}

function DataTableTFootCell({
    className,
    ...props
}) {
    return (
        <PRDataTable.TFootCell
            className={cn(
                'text-start py-2 px-3.5 font-semibold border-b border-surface-200 dark:border-surface-800',
                'bg-surface-0 dark:bg-surface-900',
                'text-surface-700 dark:text-surface-0',
                className
            )}
            {...props} />
    );
}

function DataTableSort({
    className,
    ...props
}) {
    return (
        <PRDataTable.Sort
            className={cn('group/sort inline-flex items-center gap-2 select-none', className)}
            {...props} />
    );
}

function DataTableSortIndicator({
    className,
    match,
    ...props
}) {
    return (
        <PRDataTable.SortIndicator
            match={match}
            className={cn(
                'text-xs text-surface-500 dark:text-surface-400 transition-colors duration-200',
                match === 'unsorted' && 'group-has-[[data-part=sort]]/th:not-has-[[data-sorted]]/th:group-hover/th:text-surface-600 dark:group-has-[[data-part=sort]]/th:not-has-[[data-sorted]]/th:group-hover/th:text-surface-300',
                className
            )}
            {...props} />
    );
}

function DataTableSortOrder({
    className,
    ...props
}) {
    return (
        <PRDataTable.SortOrder
            className={cn(
                'bg-primary text-primary-contrast rounded-full min-w-5 h-5 inline-flex items-center justify-center text-[10px] font-bold',
                className
            )}
            {...props} />
    );
}

function DataTableLoading({
    className,
    children,
    ...props
}) {
    return (
        <PRDataTable.Loading
            className={cn(
                'bg-white/50 dark:bg-black/30 text-surface-200 absolute inset-0 z-10 flex items-center justify-center transition-colors duration-300',
                className
            )}
            {...props}>
            {children ?? <Spinner className="animate-spin w-7 h-7" />}
        </PRDataTable.Loading>
    );
}

function DataTablePagination({
    className,
    ...props
}) {
    return (
        <PRDataTable.Pagination
            className={cn(
                'flex items-center justify-center flex-wrap py-3 px-3.5 gap-1',
                'border-t border-surface-200 dark:border-surface-700',
                'bg-surface-0 dark:bg-surface-900 text-surface-700 dark:text-surface-0',
                className
            )}
            {...props} />
    );
}

// pass-through for parts not yet styled
const DataTableCellEditor = PRDataTable.CellEditor;
const DataTableCellEditorDisplay = PRDataTable.CellEditorDisplay;
const DataTableCellEditorContent = PRDataTable.CellEditorContent;
const DataTableColumnReorder = PRDataTable.ColumnReorder;

function DataTableColumnReorderIndicatorUp({
    className,
    ...props
}) {
    return <PRDataTable.ColumnReorderIndicatorUp className={cn('absolute hidden text-primary', className)} {...props} />;
}

function DataTableColumnReorderIndicatorDown({
    className,
    ...props
}) {
    return <PRDataTable.ColumnReorderIndicatorDown className={cn('absolute hidden text-primary', className)} {...props} />;
}

function DataTableColumnReorderTarget({
    className,
    ...props
}) {
    return (
        <PRDataTable.ColumnReorderTarget
            className={cn(
                'relative flex items-center gap-2 w-full min-h-full box-border',
                'data-[drop-active]:bg-primary/10',
                'data-[drop-active]:data-[drop-side=start]:shadow-[inset_2px_0_0_0_var(--p-primary-color)]',
                'data-[drop-active]:data-[drop-side=end]:shadow-[inset_-2px_0_0_0_var(--p-primary-color)]',
                className
            )}
            {...props} />
    );
}

function DataTableColumnResizer({
    className,
    ...props
}) {
    return (
        <PRDataTable.ColumnResizer
            className={cn(
                'absolute inset-y-0 end-0 m-0 w-2 p-0 cursor-col-resize border border-transparent',
                className
            )}
            {...props} />
    );
}

function DataTableColumnResizeIndicator({
    className,
    ...props
}) {
    return (
        <PRDataTable.ColumnResizeIndicator
            className={cn('absolute top-0 w-px z-10 bg-primary', className)}
            {...props} />
    );
}

const DataTableColumnToggle = PRDataTable.ColumnToggle;
const DataTableExport = PRDataTable.Export;
const DataTableFilter = PRDataTable.Filter;

function DataTableFrozenTBody({
    className,
    ...props
}) {
    return <PRDataTable.FrozenTBody className={cn('sticky z-[2]', className)} {...props} />;
}

const DataTableRowEditor = PRDataTable.RowEditor;
const DataTableRowEditorInit = PRDataTable.RowEditorInit;
const DataTableRowEditorSave = PRDataTable.RowEditorSave;
const DataTableRowEditorCancel = PRDataTable.RowEditorCancel;
const DataTableRowExpansion = PRDataTable.RowExpansion;
const DataTableRowGroupHeader = PRDataTable.RowGroupHeader;
const DataTableRowGroupFooter = PRDataTable.RowGroupFooter;
const DataTableRowReorder = PRDataTable.RowReorder;
const DataTableRowToggle = PRDataTable.RowToggle;
const DataTableRowToggleIndicator = PRDataTable.RowToggleIndicator;
const DataTableSelection = PRDataTable.Selection;

export {
    DataTable,
    DataTableCell,
    DataTableCellEditor,
    DataTableCellEditorContent,
    DataTableCellEditorDisplay,
    DataTableColumnReorder,
    DataTableColumnReorderIndicatorDown,
    DataTableColumnReorderIndicatorUp,
    DataTableColumnReorderTarget,
    DataTableColumnResizeIndicator,
    DataTableColumnResizer,
    DataTableColumnToggle,
    DataTableEmptyTBody,
    DataTableExport,
    DataTableFilter,
    DataTableFooter,
    DataTableFrozenTBody,
    DataTableHeader,
    DataTableLoading,
    DataTablePagination,
    DataTableRow,
    DataTableRowEditor,
    DataTableRowEditorCancel,
    DataTableRowEditorInit,
    DataTableRowEditorSave,
    DataTableRowExpansion,
    DataTableRowGroupFooter,
    DataTableRowGroupHeader,
    DataTableRowReorder,
    DataTableRowToggle,
    DataTableRowToggleIndicator,
    DataTableSelection,
    DataTableSort,
    DataTableSortIndicator,
    DataTableSortOrder,
    DataTableTBody,
    DataTableTFoot,
    DataTableTFootCell,
    DataTableTFootRow,
    DataTableTHead,
    DataTableTHeadCell,
    DataTableTHeadRow,
    DataTableTHeadTitle,
    DataTableTable,
    DataTableTableContainer
};
