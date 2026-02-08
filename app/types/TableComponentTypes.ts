export type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
};

export type PaginationProps = {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
};

export type DataTableProps<T> = {
  title: string;
  columns: Column<T>[];
  data: T[];
  emptyText: string;
  rowClassName?: string;
  pagination?: PaginationProps;
};