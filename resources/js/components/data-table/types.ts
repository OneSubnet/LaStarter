import type {
    ColumnDef,
    SortingState,
    VisibilityState,
} from '@tanstack/react-table';
import type { PAGE_SIZE_OPTIONS } from '@/lib/constants';

export type DataTablePaginationOptions = typeof PAGE_SIZE_OPTIONS;

export type DataTableProps<T> = {
    columns: ColumnDef<T>[];
    data: T[];
    searchPlaceholder?: string;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    toolbarActions?: React.ReactNode;
    emptyState?: React.ReactNode;
    pageSize?: number;
    initialSorting?: SortingState;
    initialColumnVisibility?: VisibilityState;
};

export type DataTableToolbarProps = {
    globalFilter: string;
    setGlobalFilter: (value: string) => void;
    columns: {
        id: string;
        getCanHide: () => boolean;
        getIsVisible: () => boolean;
        toggleVisibility: (value: boolean) => void;
    }[];
    children?: React.ReactNode;
};
