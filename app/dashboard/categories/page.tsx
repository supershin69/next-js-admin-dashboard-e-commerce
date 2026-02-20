"use client";

import { CategoryModel } from "@/app/interfaces/categoryModel";
import { fetchCategoryList } from "@/app/lib/fetchCategoryList";
import { deleteCategories } from "@/app/lib/deleteCategories";
import { useEffect, useMemo, useState } from "react";
import { ShadcnDataTable, ShadcnColumn } from "@/app/components/ShadcnDataTable";
import { Badge } from "@/app/components/ui/badge";

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
  const [error, setError] = useState("");

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
      />
    </div>
  );
};

export default Categories;
