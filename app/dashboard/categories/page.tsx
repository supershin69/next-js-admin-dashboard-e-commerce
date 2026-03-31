"use client";

import { CategoryModel } from "@/app/interfaces/categoryModel";
import { fetchCategoryList } from "@/app/lib/fetchCategoryList";
import { deleteCategories } from "@/app/lib/deleteCategories";
import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileImport, faPlus } from "@fortawesome/free-solid-svg-icons";
import { ShadcnDataTable, ShadcnColumn } from "@/app/components/ShadcnDataTable";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import client from "@/app/api/client";
import { CsvImportModal } from "@/app/components/CsvImportModal";
import { CsvRow } from "@/app/lib/csv";

const columns: ShadcnColumn<CategoryModel>[] = [
  {
    key: "id",
    header: "ID",
    cell: (category) => <span className="font-mono text-xs">{category.id}</span>,
  },
  {
    key: "name",
    header: "Name",
    cell: (category) => category.name,
  },
  {
    key: "image",
    header: "Image",
    cell: (category) =>
      category.image_url ? (
        <a
          href={category.image_url}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-blue-600 underline"
        >
          View
        </a>
      ) : (
        <Badge variant="secondary">No image</Badge>
      ),
  },
  {
    key: "created_at",
    header: "Created",
    cell: (category) => new Date(category.created_at).toLocaleDateString(),
  },
];

const Categories = () => {
  const [category, setCategory] = useState<CategoryModel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");

  useEffect(() => {
    const fetchCategory = async () => {
      setIsLoading(true);
      const categoryList = await fetchCategoryList();
      setCategory(categoryList);
      setIsLoading(false);
    };
    fetchCategory();
  }, []);

  const sortedCategories = useMemo(
    () =>
      [...category].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [category]
  );

  const handleDelete = async (ids: string[]) => {
    setDeleting(true);
    setError("");
    try {
      await deleteCategories(ids);
      setCategory((prev) => prev.filter((row) => !ids.includes(row.id)));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newName.trim()) {
      setError("Category name is required.");
      return;
    }

    setCreating(true);
    setError("");
    try {
      const { data, error: createError } = await client
        .from("categories")
        .insert({
          name: newName.trim(),
          image_url: newImageUrl.trim() || null,
        })
        .select("id, name, image_url, created_at")
        .single<CategoryModel>();

      if (createError || !data) {
        throw new Error(createError?.message ?? "Failed to create category");
      }

      setCategory((prev) => [data, ...prev]);
      setCreateOpen(false);
      setNewName("");
      setNewImageUrl("");
    } catch (createCategoryError) {
      setError(
        createCategoryError instanceof Error ? createCategoryError.message : "Create failed"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleImportCategories = async (rows: CsvRow[]) => {
    setImporting(true);
    setError("");
    try {
      const normalized = rows.map((row) => ({
        name: row.name?.trim(),
        image_url: row.image_url?.trim() || "",
      }));

      if (normalized.some((row) => !row.name)) {
        throw new Error("Each CSV row must include name.");
      }

      const { data: existingData, error: existingError } = await client
        .from("categories")
        .select("id, name");
      if (existingError) throw new Error(existingError.message);

      const existingByName = new Map(
        ((existingData ?? []) as Array<{ id: string; name: string }>).map((item) => [
          item.name.toLowerCase(),
          item.id,
        ])
      );

      for (const row of normalized) {
        const existingId = existingByName.get(row.name!.toLowerCase());
        if (existingId) {
          const { error: updateError } = await client
            .from("categories")
            .update({ name: row.name, image_url: row.image_url || null })
            .eq("id", existingId);
          if (updateError) throw new Error(updateError.message);
        } else {
          const { error: insertError } = await client.from("categories").insert({
            name: row.name,
            image_url: row.image_url || null,
          });
          if (insertError) throw new Error(insertError.message);
        }
      }

      const refreshed = await fetchCategoryList();
      setCategory(refreshed);
    } finally {
      setImporting(false);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading categories...</div>;
  }

  return (
    <div className="min-h-screen space-y-4 p-6">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <ShadcnDataTable
        title="Categories"
        data={sortedCategories}
        columns={columns}
        getRowId={(row) => row.id}
        getRowName={(row) => row.name}
        getRowCreatedAt={(row) => row.created_at}
        getRowCategory={() => "Category"}
        onDeleteRows={handleDelete}
        deleting={deleting}
        emptyText="No categories found."
        itemsPerPage={8}
        exportFileName="categories"
        getExportRow={(row) => ({
          id: row.id,
          name: row.name,
          image_url: row.image_url ?? "",
          created_at: row.created_at,
        })}
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
            <h3 className="text-lg font-semibold">Create Category</h3>
            <div className="mt-4 space-y-3">
              <label className="block space-y-1 text-sm">
                <span>Name</span>
                <input
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 bg-background px-3"
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span>Image URL</span>
                <input
                  value={newImageUrl}
                  onChange={(event) => setNewImageUrl(event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 bg-background px-3"
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-emerald-700 text-white hover:bg-emerald-800"
                onClick={handleCreateCategory}
                disabled={creating}
              >
                {creating ? "Creating..." : "Create Category"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <CsvImportModal
        open={importOpen}
        title="Import Categories CSV"
        requiredHeaders={["name"]}
        optionalHeaders={["image_url"]}
        importing={importing}
        onClose={() => setImportOpen(false)}
        onImport={handleImportCategories}
      />
    </div>
  );
};

export default Categories;
