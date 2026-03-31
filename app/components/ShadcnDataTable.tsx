"use client";

import { ReactNode, useMemo, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Checkbox } from "@/app/components/ui/checkbox";
import { PaginationControls } from "@/app/components/PaginationControls";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileCsv, faTrash } from "@fortawesome/free-solid-svg-icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";

type SortOption =
  | "date_desc"
  | "date_asc"
  | "alphabet_asc"
  | "alphabet_desc";

export type ShadcnColumn<T> = {
  key: string;
  header: string;
  className?: string;
  cell: (row: T) => ReactNode;
};

type ShadcnDataTableProps<T> = {
  title: string;
  data: T[];
  columns: ShadcnColumn<T>[];
  getRowId: (row: T) => string;
  getRowName: (row: T) => string;
  getRowCreatedAt: (row: T) => string;
  getRowCategory: (row: T) => string;
  onDeleteRows: (ids: string[]) => Promise<void>;
  deleting?: boolean;
  emptyText: string;
  categoryLabel?: string;
  itemsPerPage?: number;
  toolbarActions?: ReactNode;
  rowActions?: (row: T) => ReactNode;
  canDelete?: boolean;
  canDeleteRow?: (row: T) => boolean;
  exportFileName?: string;
  getExportRow?: (row: T) => Record<string, string | number | boolean | null | undefined>;
};

export function ShadcnDataTable<T>({
  title,
  data,
  columns,
  getRowId,
  getRowName,
  getRowCreatedAt,
  getRowCategory,
  onDeleteRows,
  deleting = false,
  emptyText,
  categoryLabel = "Category",
  itemsPerPage = 10,
  toolbarActions,
  rowActions,
  canDelete = true,
  canDeleteRow,
  exportFileName = "table-export",
  getExportRow,
}: ShadcnDataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date_desc");
  const [category, setCategory] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);

  const categoryOptions = useMemo(() => {
    const unique = Array.from(
      new Set(data.map((row) => getRowCategory(row)).filter(Boolean))
    );
    return unique.sort((a, b) => a.localeCompare(b));
  }, [data, getRowCategory]);

  const filteredData = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();

    const searched = data.filter((row) => {
      const id = getRowId(row).toLowerCase();
      const name = getRowName(row).toLowerCase();

      const matchesSearch =
        normalized.length === 0 ||
        id.includes(normalized) ||
        name.includes(normalized);

      const rowCategory = getRowCategory(row);
      const matchesCategory = category === "all" || rowCategory === category;

      return matchesSearch && matchesCategory;
    });

    return searched.sort((a, b) => {
      if (sortBy === "date_desc") {
        return (
          new Date(getRowCreatedAt(b)).getTime() -
          new Date(getRowCreatedAt(a)).getTime()
        );
      }

      if (sortBy === "date_asc") {
        return (
          new Date(getRowCreatedAt(a)).getTime() -
          new Date(getRowCreatedAt(b)).getTime()
        );
      }

      if (sortBy === "alphabet_asc") {
        return getRowName(a).localeCompare(getRowName(b));
      }

      return getRowName(b).localeCompare(getRowName(a));
    });
  }, [
    data,
    searchTerm,
    sortBy,
    category,
    getRowId,
    getRowName,
    getRowCategory,
    getRowCreatedAt,
  ]);

  const canDeleteByRow = (row: T) => (canDeleteRow ? canDeleteRow(row) : true);

  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedData = filteredData.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage
  );

  const selectableVisibleIds = paginatedData
    .filter((row) => canDeleteByRow(row))
    .map((row) => getRowId(row));

  const allVisibleSelected =
    selectableVisibleIds.length > 0 &&
    selectableVisibleIds.every((id) => selectedIds.includes(id));

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      const visibleIds = selectableVisibleIds;
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
      return;
    }

    const merged = new Set(selectedIds);
    selectableVisibleIds.forEach((id) => merged.add(id));
    setSelectedIds(Array.from(merged));
  };

  const toggleSelectRow = (id: string, row: T) => {
    if (!canDeleteByRow(row)) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    if (!canDelete || selectedIds.length === 0) return;
    setPendingDeleteIds(selectedIds);
    setIsConfirmOpen(true);
  };

  const handleDeleteSingle = (id: string, row: T) => {
    if (!canDelete || !canDeleteByRow(row)) return;
    setPendingDeleteIds([id]);
    setIsConfirmOpen(true);
  };

  const closeConfirm = () => {
    setIsConfirmOpen(false);
    setPendingDeleteIds([]);
  };

  const handleConfirmDelete = async () => {
    const ids = [...pendingDeleteIds];
    closeConfirm();
    await onDeleteRows(ids);
    setSelectedIds((prev) => prev.filter((value) => !ids.includes(value)));
  };

  const handleExportCsv = () => {
    if (!getExportRow) return;
    const exportRows = filteredData.map(getExportRow);
    if (exportRows.length === 0) return;

    const headers = Object.keys(exportRows[0]);
    const escapeCsvCell = (value: unknown) => {
      const stringValue = String(value ?? "");
      if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csvLines = [
      headers.join(","),
      ...exportRows.map((row) =>
        headers.map((header) => escapeCsvCell(row[header])).join(",")
      ),
    ];

    const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${exportFileName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const showActionsColumn = canDelete || Boolean(rowActions);

  return (
    <>
    <section className="space-y-4 rounded-xl border border-gray-200 bg-background p-4 text-foreground shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <div className="flex items-center gap-2">
            {getExportRow && (
              <Button variant="outline" className="gap-2" onClick={handleExportCsv}>
                <FontAwesomeIcon icon={faFileCsv} />
                Export CSV
              </Button>
            )}
            {toolbarActions}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <Input
            placeholder="Search by name or ID"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setCurrentPage(1);
            }}
          />
          <select
            value={sortBy}
            onChange={(event) => {
              setSortBy(event.target.value as SortOption);
              setCurrentPage(1);
            }}
            className="h-10 rounded-md border border-gray-300 bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-gray-900/20"
          >
            <option value="date_desc">Date: Newest first</option>
            <option value="date_asc">Date: Oldest first</option>
            <option value="alphabet_asc">Alphabet: A-Z</option>
            <option value="alphabet_desc">Alphabet: Z-A</option>
          </select>
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setCurrentPage(1);
            }}
            className="h-10 rounded-md border border-gray-300 bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-gray-900/20"
          >
            <option value="all">{categoryLabel}: All</option>
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {canDelete ? (
            <Button
              variant="destructive"
              onClick={handleDeleteSelected}
              disabled={deleting || selectedIds.length === 0}
              className="gap-2"
            >
              <FontAwesomeIcon icon={faTrash} />
              {deleting ? "Deleting..." : `Delete Selected (${selectedIds.length})`}
            </Button>
          ) : (
            <div />
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              {canDelete && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={allVisibleSelected}
                    onChange={toggleSelectAllVisible}
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead key={column.key} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
              {showActionsColumn && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 && (
              <TableRow>
                <TableCell
                  className="text-center text-gray-500"
                  colSpan={columns.length + (canDelete ? 1 : 0) + (showActionsColumn ? 1 : 0)}
                >
                  {emptyText}
                </TableCell>
              </TableRow>
            )}
            {paginatedData.map((row) => {
              const id = getRowId(row);
              return (
                <TableRow key={id}>
                  {canDelete && (
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(id)}
                        onChange={() => toggleSelectRow(id, row)}
                        disabled={!canDeleteByRow(row)}
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={`${column.key}-${id}`} className={column.className}>
                      {column.cell(row)}
                    </TableCell>
                  ))}
                  {showActionsColumn && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {rowActions?.(row)}
                        {canDelete && canDeleteByRow(row) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSingle(id, row)}
                            disabled={deleting}
                            className="gap-1 text-red-600 hover:text-red-700"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <PaginationControls
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          currentPage={safeCurrentPage}
          setCurrentPage={setCurrentPage}
        />
      </div>
    </section>
    {isConfirmOpen && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        onClick={closeConfirm}
      >
        <div
          className="w-full max-w-md rounded-xl border border-gray-200 bg-background p-6 shadow-xl"
          onClick={(event) => event.stopPropagation()}
        >
          <h3 className="text-lg font-semibold text-foreground">
            Confirm deletion
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Are you sure you want to delete {pendingDeleteIds.length} item
            {pendingDeleteIds.length > 1 ? "s" : ""}?
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={closeConfirm}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              className="gap-2"
            >
              <FontAwesomeIcon icon={faTrash} />
              Delete
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
