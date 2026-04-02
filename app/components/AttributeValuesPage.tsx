"use client";

import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileImport, faPenToSquare, faPlus } from "@fortawesome/free-solid-svg-icons";
import { ShadcnColumn, ShadcnDataTable } from "@/app/components/ShadcnDataTable";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { CsvImportModal } from "@/app/components/CsvImportModal";
import { CsvRow } from "@/app/lib/csv";
import client from "@/app/api/client";

type AttributeTypeRow = {
  id: string;
  name: string;
  display_name: string;
};

type AttributeValueRow = {
  id: string;
  value: string;
  display_value: string | null;
  color_hex: string | null;
  created_at: string;
};

type AttributeValuesPageProps = {
  title: string;
  typeMatchers: string[];
  emptyText: string;
  colorEnabled?: boolean;
  categoryLabel?: string;
};

const normalizeMatcher = (value: string) => value.trim().toLowerCase();

const normalizeHex = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const candidate = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(candidate)) {
    throw new Error("Color hex must be 3 or 6 hex characters.");
  }
  return candidate.toLowerCase();
};

const ColorPreview = ({ hex }: { hex: string | null }) => {
  if (!hex) return <Badge variant="secondary">None</Badge>;
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-4 w-4 rounded-full border border-gray-300"
        style={{ backgroundColor: hex }}
      />
      <span className="text-xs font-mono text-gray-700">{hex}</span>
    </div>
  );
};

const AttributeValuesPage = ({
  title,
  typeMatchers,
  emptyText,
  colorEnabled = false,
  categoryLabel = "Type",
}: AttributeValuesPageProps) => {
  const [typeId, setTypeId] = useState<string | null>(null);
  const [typeLabel, setTypeLabel] = useState("");
  const [rows, setRows] = useState<AttributeValueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [newDisplayValue, setNewDisplayValue] = useState("");
  const [newColorHex, setNewColorHex] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editDisplayValue, setEditDisplayValue] = useState("");
  const [editColorHex, setEditColorHex] = useState("");
  const [editError, setEditError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const matchers = useMemo(() => typeMatchers.map(normalizeMatcher), [typeMatchers]);

  const loadData = async () => {
    setLoading(true);
    setError("");

    const { data: typeData, error: typeError } = await client
      .from("attribute_types")
      .select("id, name, display_name");

    if (typeError) {
      setError(typeError.message);
      setLoading(false);
      return;
    }

    const types = (typeData ?? []) as AttributeTypeRow[];
    const matchedType =
      types.find((type) => {
        const name = normalizeMatcher(type.name ?? "");
        const display = normalizeMatcher(type.display_name ?? "");
        return matchers.some((matcher) => name.includes(matcher) || display.includes(matcher));
      }) ?? null;

    if (!matchedType) {
      setError("Attribute type not found for this page.");
      setLoading(false);
      return;
    }

    setTypeId(matchedType.id);
    setTypeLabel(matchedType.display_name ?? matchedType.name);

    const { data: valueData, error: valueError } = await client
      .from("attribute_values")
      .select("id, value, display_value, color_hex, created_at")
      .eq("attribute_type_id", matchedType.id)
      .order("created_at", { ascending: false });

    if (valueError) {
      setError(valueError.message);
      setLoading(false);
      return;
    }

    setRows((valueData ?? []) as AttributeValueRow[]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [matchers.join("|")]);

  const sortedRows = useMemo(
    () =>
      [...rows].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [rows]
  );

  const handleDelete = async (ids: string[]) => {
    if (ids.length === 0) return;
    setDeleting(true);
    setError("");
    const { error: deleteError } = await client.from("attribute_values").delete().in("id", ids);
    if (deleteError) {
      setError(deleteError.message);
    } else {
      setRows((prev) => prev.filter((row) => !ids.includes(row.id)));
    }
    setDeleting(false);
  };

  const handleCreate = async () => {
    if (!typeId) return;
    if (!newValue.trim()) {
      setError("Value is required.");
      return;
    }

    setCreating(true);
    setError("");
    try {
      const colorHex = colorEnabled ? normalizeHex(newColorHex) : null;
      const { data, error: insertError } = await client
        .from("attribute_values")
        .insert({
          attribute_type_id: typeId,
          value: newValue.trim(),
          display_value: newDisplayValue.trim() || null,
          color_hex: colorHex,
        })
        .select("id, value, display_value, color_hex, created_at")
        .single<AttributeValueRow>();

      if (insertError || !data) {
        throw new Error(insertError?.message ?? "Failed to create value");
      }

      setRows((prev) => [data, ...prev]);
      setCreateOpen(false);
      setNewValue("");
      setNewDisplayValue("");
      setNewColorHex("");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Create failed");
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (row: AttributeValueRow) => {
    setEditOpen(true);
    setEditingId(row.id);
    setEditValue(row.value);
    setEditDisplayValue(row.display_value ?? "");
    setEditColorHex(row.color_hex ?? "");
    setEditError("");
  };

  const closeEditModal = () => {
    setEditOpen(false);
    setEditingId(null);
    setEditValue("");
    setEditDisplayValue("");
    setEditColorHex("");
    setEditError("");
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    if (!editValue.trim()) {
      setEditError("Value is required.");
      return;
    }

    setSavingEdit(true);
    setEditError("");
    try {
      const colorHex = colorEnabled ? normalizeHex(editColorHex) : null;
      const { data, error: updateError } = await client
        .from("attribute_values")
        .update({
          value: editValue.trim(),
          display_value: editDisplayValue.trim() || null,
          color_hex: colorHex,
        })
        .eq("id", editingId)
        .select("id, value, display_value, color_hex, created_at")
        .single<AttributeValueRow>();

      if (updateError || !data) {
        throw new Error(updateError?.message ?? "Failed to update value");
      }

      setRows((prev) => prev.map((row) => (row.id === data.id ? data : row)));
      closeEditModal();
    } catch (updateError) {
      setEditError(updateError instanceof Error ? updateError.message : "Update failed");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleImport = async (importRows: CsvRow[]) => {
    if (!typeId) return;
    setImporting(true);
    setError("");
    try {
      const { data: existingData, error: existingError } = await client
        .from("attribute_values")
        .select("id, value")
        .eq("attribute_type_id", typeId);
      if (existingError) throw new Error(existingError.message);

      const existingByValue = new Map(
        ((existingData ?? []) as Array<{ id: string; value: string }>).map((row) => [
          row.value.toLowerCase(),
          row.id,
        ])
      );

      for (const row of importRows) {
        const value = row.value?.trim();
        if (!value) throw new Error("Each CSV row must include value.");

        const displayValue = row.display_value?.trim() || null;
        const colorHex = colorEnabled ? normalizeHex(row.color_hex ?? "") : null;
        const existingId = existingByValue.get(value.toLowerCase());

        if (existingId) {
          const { error: updateError } = await client
            .from("attribute_values")
            .update({
              value,
              display_value: displayValue,
              color_hex: colorHex,
            })
            .eq("id", existingId);
          if (updateError) throw new Error(updateError.message);
        } else {
          const { error: insertError } = await client.from("attribute_values").insert({
            attribute_type_id: typeId,
            value,
            display_value: displayValue,
            color_hex: colorHex,
          });
          if (insertError) throw new Error(insertError.message);
        }
      }

      await loadData();
    } finally {
      setImporting(false);
    }
  };

  const columns: ShadcnColumn<AttributeValueRow>[] = [
    {
      key: "id",
      header: "ID",
      cell: (row) => <span className="font-mono text-xs">{row.id}</span>,
    },
    {
      key: "value",
      header: "Value",
      cell: (row) => row.value,
    },
    {
      key: "display_value",
      header: "Display",
      cell: (row) => row.display_value ?? "-",
    },
    ...(colorEnabled
      ? [
          {
            key: "color_hex",
            header: "Color",
            cell: (row: AttributeValueRow) => <ColorPreview hex={row.color_hex} />,
          } satisfies ShadcnColumn<AttributeValueRow>,
        ]
      : []),
    {
      key: "created_at",
      header: "Created",
      cell: (row) => new Date(row.created_at).toLocaleDateString(),
    },
  ];

  if (loading) return <div className="p-6">Loading {title.toLowerCase()}...</div>;

  return (
    <div className="min-h-screen space-y-4 p-6">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <ShadcnDataTable
        title={title}
        data={sortedRows}
        columns={columns}
        getRowId={(row) => row.id}
        getRowName={(row) => row.display_value ?? row.value}
        getRowCreatedAt={(row) => row.created_at}
        getRowCategory={() => typeLabel || title}
        onDeleteRows={handleDelete}
        deleting={deleting}
        emptyText={emptyText}
        categoryLabel={categoryLabel}
        itemsPerPage={8}
        exportFileName={title.toLowerCase()}
        getExportRow={(row) => ({
          id: row.id,
          value: row.value,
          display_value: row.display_value,
          color_hex: row.color_hex,
          created_at: row.created_at,
        })}
        rowActions={(row) => (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-blue-600 hover:text-blue-700"
            onClick={() => openEditModal(row)}
          >
            <FontAwesomeIcon icon={faPenToSquare} />
          </Button>
        )}
        toolbarActions={
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setImportOpen(true)}>
              <FontAwesomeIcon icon={faFileImport} />
              Import CSV
            </Button>
            <Button
              className="gap-2 bg-emerald-700 text-white hover:bg-emerald-800"
              onClick={() => setCreateOpen(true)}
            >
              <FontAwesomeIcon icon={faPlus} />
              Create New
            </Button>
          </div>
        }
      />

      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setCreateOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-gray-200 bg-background p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">Create {title}</h3>
            <div className="mt-4 space-y-3">
              <label className="block space-y-1 text-sm">
                <span>Value</span>
                <input
                  value={newValue}
                  onChange={(event) => setNewValue(event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 bg-background px-3"
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span>Display Value</span>
                <input
                  value={newDisplayValue}
                  onChange={(event) => setNewDisplayValue(event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 bg-background px-3"
                />
              </label>
              {colorEnabled && (
                <label className="block space-y-1 text-sm">
                  <span>Color Hex</span>
                  <input
                    value={newColorHex}
                    onChange={(event) => setNewColorHex(event.target.value)}
                    placeholder="#ff0000"
                    className="h-10 w-full rounded-md border border-gray-300 bg-background px-3 font-mono"
                  />
                </label>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-emerald-700 text-white hover:bg-emerald-800"
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={closeEditModal}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-gray-200 bg-background p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">Update {title}</h3>
            <div className="mt-4 space-y-3">
              <label className="block space-y-1 text-sm">
                <span>Value</span>
                <input
                  value={editValue}
                  onChange={(event) => setEditValue(event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 bg-background px-3"
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span>Display Value</span>
                <input
                  value={editDisplayValue}
                  onChange={(event) => setEditDisplayValue(event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 bg-background px-3"
                />
              </label>
              {colorEnabled && (
                <label className="block space-y-1 text-sm">
                  <span>Color Hex</span>
                  <input
                    value={editColorHex}
                    onChange={(event) => setEditColorHex(event.target.value)}
                    placeholder="#ff0000"
                    className="h-10 w-full rounded-md border border-gray-300 bg-background px-3 font-mono"
                  />
                </label>
              )}
            </div>
            {editError && <p className="mt-3 text-sm text-red-600">{editError}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={closeEditModal}>
                Cancel
              </Button>
              <Button
                className="bg-emerald-700 text-white hover:bg-emerald-800"
                onClick={handleUpdate}
                disabled={savingEdit}
              >
                {savingEdit ? "Saving..." : "Update"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <CsvImportModal
        open={importOpen}
        title={`Import ${title} CSV`}
        requiredHeaders={["value"]}
        optionalHeaders={["display_value", ...(colorEnabled ? ["color_hex"] : [])]}
        importing={importing}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
      />
    </div>
  );
};

export default AttributeValuesPage;
