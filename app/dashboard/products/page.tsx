"use client";

import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileImport, faPenToSquare, faPlus } from "@fortawesome/free-solid-svg-icons";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { ShadcnDataTable, ShadcnColumn } from "@/app/components/ShadcnDataTable";
import { ProductModel } from "@/app/interfaces/productModel";
import { fetchProductList } from "@/app/lib/fetchProductList";
import { deleteProducts } from "@/app/lib/deleteProducts";
import client from "@/app/api/client";
import { CsvImportModal } from "@/app/components/CsvImportModal";
import { CsvRow, parseBooleanCell } from "@/app/lib/csv";
import { uploadProductLocalImage } from "./actions";

type SelectOption = {
  id: string;
  name: string;
};

const parseUrls = (value: string) =>
  value
    .split(/[\n,]/g)
    .map((item) => item.trim())
    .filter(Boolean);

const columns: ShadcnColumn<ProductModel>[] = [
  {
    key: "id",
    header: "Product ID",
    cell: (product) => <span className="font-mono text-xs">{product.id}</span>,
  },
  {
    key: "name",
    header: "Name",
    cell: (product) => product.name,
  },
  {
    key: "category_name",
    header: "Category",
    cell: (product) => <Badge variant="secondary">{product.category_name}</Badge>,
  },
  {
    key: "brand_name",
    header: "Brand",
    cell: (product) => product.brand_name,
  },
  {
    key: "created_at",
    header: "Created",
    cell: (product) => new Date(product.created_at).toLocaleDateString(),
  },
];

const Products = () => {
  const [products, setProducts] = useState<ProductModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<SelectOption[]>([]);
  const [brandOptions, setBrandOptions] = useState<SelectOption[]>([]);
  const [newName, setNewName] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newBrandId, setNewBrandId] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newImageUrls, setNewImageUrls] = useState("");
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editBrandId, setEditBrandId] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImageUrls, setEditImageUrls] = useState("");
  const [editImageFiles, setEditImageFiles] = useState<File[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [data, categoriesResult, brandsResult] = await Promise.all([
        fetchProductList(),
        client.from("categories").select("id, name").order("name", { ascending: true }),
        client.from("brands").select("id, name").order("name", { ascending: true }),
      ]);

      setProducts(data);
      setCategoryOptions((categoriesResult.data as SelectOption[]) ?? []);
      setBrandOptions((brandsResult.data as SelectOption[]) ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const sortedProducts = useMemo(
    () =>
      [...products].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [products]
  );

  const handleDelete = async (ids: string[]) => {
    setDeleting(true);
    setError("");
    try {
      await deleteProducts(ids);
      setProducts((prev) => prev.filter((row) => !ids.includes(row.id)));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = async (productId: string) => {
    setEditOpen(true);
    setEditingProductId(productId);
    setEditLoading(true);
    setEditError("");
    setEditImageFiles([]);
    try {
      const { data, error: fetchError } = await client
        .from("products")
        .select("id, name, category_id, brand_id, description")
        .eq("id", productId)
        .single<{
          id: string;
          name: string;
          category_id: string | null;
          brand_id: string | null;
          description: string | null;
        }>();

      if (fetchError || !data) {
        throw new Error(fetchError?.message ?? "Failed to load product details");
      }

      setEditName(data.name ?? "");
      setEditCategoryId(data.category_id ?? "");
      setEditBrandId(data.brand_id ?? "");
      setEditDescription(data.description ?? "");

      const { data: imageData, error: imageError } = await client
        .from("product_images")
        .select("url, attribute_value_id, sort_order")
        .eq("product_id", productId)
        .order("sort_order", { ascending: true });

      if (imageError) {
        throw new Error(imageError.message);
      }

      const baseImages = (imageData ?? [])
        .filter((row) => !row.attribute_value_id)
        .map((row) => row.url)
        .filter(Boolean);
      setEditImageUrls(baseImages.join("\n"));
    } catch (loadError) {
      setEditError(loadError instanceof Error ? loadError.message : "Failed to load product");
    } finally {
      setEditLoading(false);
    }
  };

  const closeEditModal = () => {
    setEditOpen(false);
    setEditingProductId(null);
    setEditName("");
    setEditCategoryId("");
    setEditBrandId("");
    setEditDescription("");
    setEditImageUrls("");
    setEditImageFiles([]);
    setEditError("");
  };

  const handleUpdateProduct = async () => {
    if (!editingProductId) return;
    if (!editName.trim() || !editCategoryId || !editBrandId) {
      setEditError("Name, category, and brand are required.");
      return;
    }

    setSavingEdit(true);
    setEditError("");
    try {
      const { data, error: updateError } = await client
        .from("products")
        .update({
          name: editName.trim(),
          category_id: editCategoryId,
          brand_id: editBrandId,
          description: editDescription.trim() || null,
        })
        .eq("id", editingProductId)
        .select("id, name, category_id, brand_id")
        .single<{
          id: string;
          name: string;
          category_id: string;
          brand_id: string;
        }>();

      if (updateError || !data) {
        throw new Error(updateError?.message ?? "Failed to update product");
      }

      const externalUrls = parseUrls(editImageUrls);
      const uploadedLocalUrls = await uploadLocalFiles(editImageFiles, editingProductId);
      const mergedImageUrls = Array.from(new Set([...externalUrls, ...uploadedLocalUrls]));

      const { error: deleteImagesError } = await client
        .from("product_images")
        .delete()
        .eq("product_id", editingProductId)
        .is("attribute_value_id", null);

      if (deleteImagesError) {
        throw new Error(deleteImagesError.message);
      }

      if (mergedImageUrls.length > 0) {
        const { error: imageInsertError } = await client.from("product_images").insert(
          mergedImageUrls.map((url, index) => ({
            product_id: editingProductId,
            url,
            sort_order: index,
            is_primary: index === 0,
          }))
        );

        if (imageInsertError) {
          throw new Error(imageInsertError.message);
        }
      }

      const categoryName =
        categoryOptions.find((option) => option.id === data.category_id)?.name ??
        "Uncategorized";
      const brandName =
        brandOptions.find((option) => option.id === data.brand_id)?.name ?? "Unknown";

      setProducts((prev) =>
        prev.map((row) =>
          row.id === data.id
            ? {
                ...row,
                name: data.name,
                category_name: categoryName,
                brand_name: brandName,
              }
            : row
        )
      );

      closeEditModal();
    } catch (updateProductError) {
      setEditError(
        updateProductError instanceof Error ? updateProductError.message : "Update failed"
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const toSlug = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const uploadLocalFiles = async (files: File[], productId: string) => {
    if (files.length === 0) return [];

    const {
      data: { session },
      error: sessionError,
    } = await client.auth.getSession();

    if (sessionError || !session?.access_token) {
      throw new Error(sessionError?.message ?? "Please sign in again before uploading images.");
    }

    return Promise.all(
      files.map(async (file) => {
        const formData = new FormData();
        formData.set("accessToken", session.access_token);
        formData.set("productId", productId);
        formData.set("file", file);

        const result = await uploadProductLocalImage(formData);
        if (result.error || !result.url) {
          throw new Error(result.error ?? `Failed to upload image: ${file.name}`);
        }

        return result.url;
      })
    );
  };

  const handleCreateProduct = async () => {
    if (!newName.trim() || !newCategoryId || !newBrandId) {
      setError("Name, category, and brand are required.");
      return;
    }

    setCreating(true);
    setError("");
    try {
      const generatedSlug = `${toSlug(newName)}-${Date.now()}`;
      const { data: insertedProduct, error: createError } = await client
        .from("products")
        .insert({
          name: newName.trim(),
          slug: generatedSlug,
          category_id: newCategoryId,
          brand_id: newBrandId,
          description: newDescription.trim() || null,
        })
        .select("id, name, created_at, category_id, brand_id")
        .single<{
          id: string;
          name: string;
          created_at: string;
          category_id: string;
          brand_id: string;
        }>();

      if (createError || !insertedProduct) {
        throw new Error(createError?.message ?? "Failed to create product");
      }

      const externalUrls = parseUrls(newImageUrls);
      const uploadedLocalUrls = await uploadLocalFiles(newImageFiles, insertedProduct.id);
      const mergedImageUrls = Array.from(new Set([...externalUrls, ...uploadedLocalUrls]));

      if (mergedImageUrls.length > 0) {
        const { error: imageError } = await client.from("product_images").insert(
          mergedImageUrls.map((url, index) => ({
            product_id: insertedProduct.id,
            url,
            sort_order: index,
            is_primary: index === 0,
          }))
        );

        if (imageError) {
          throw new Error(imageError.message);
        }
      }

      const categoryName =
        categoryOptions.find((option) => option.id === insertedProduct.category_id)?.name ??
        "Uncategorized";
      const brandName =
        brandOptions.find((option) => option.id === insertedProduct.brand_id)?.name ??
        "Unknown";

      setProducts((prev) => [
        {
          id: insertedProduct.id,
          name: insertedProduct.name,
          created_at: insertedProduct.created_at,
          category_name: categoryName,
          brand_name: brandName,
        },
        ...prev,
      ]);

      setCreateOpen(false);
      setNewName("");
      setNewCategoryId("");
      setNewBrandId("");
      setNewDescription("");
      setNewImageUrls("");
      setNewImageFiles([]);
    } catch (createProductError) {
      setError(createProductError instanceof Error ? createProductError.message : "Create failed");
    } finally {
      setCreating(false);
    }
  };

  const handleImportProducts = async (rows: CsvRow[]) => {
    setImporting(true);
    setError("");
    try {
      const [categoryResult, brandResult, existingProductResult] = await Promise.all([
        client.from("categories").select("id, name"),
        client.from("brands").select("id, name"),
        client.from("products").select("id, name"),
      ]);

      if (categoryResult.error) throw new Error(categoryResult.error.message);
      if (brandResult.error) throw new Error(brandResult.error.message);
      if (existingProductResult.error) throw new Error(existingProductResult.error.message);

      const categoryMap = new Map(
        ((categoryResult.data ?? []) as SelectOption[]).map((row) => [
          row.name.toLowerCase(),
          row.id,
        ])
      );
      const brandMap = new Map(
        ((brandResult.data ?? []) as SelectOption[]).map((row) => [
          row.name.toLowerCase(),
          row.id,
        ])
      );
      const existingProducts = new Map(
        ((existingProductResult.data ?? []) as Array<{ id: string; name: string }>).map(
          (row) => [row.name.toLowerCase(), row.id]
        )
      );

      for (const row of rows) {
        const name = row.name?.trim();
        const categoryName = row.category?.trim().toLowerCase();
        const brandName = row.brand?.trim().toLowerCase();
        const description = row.description?.trim();

        if (!name || !categoryName || !brandName) {
          throw new Error("Each row must include name, category, and brand.");
        }

        const categoryId = categoryMap.get(categoryName);
        if (!categoryId) throw new Error(`Unknown category name: ${row.category}`);
        const brandId = brandMap.get(brandName);
        if (!brandId) throw new Error(`Unknown brand name: ${row.brand}`);

        const existingId = existingProducts.get(name.toLowerCase());
        if (existingId) {
          const { error: updateError } = await client
            .from("products")
            .update({
              name,
              category_id: categoryId,
              brand_id: brandId,
              description: description || null,
              is_archived: parseBooleanCell(row.is_archived ?? "", false),
            })
            .eq("id", existingId);
          if (updateError) throw new Error(updateError.message);
        } else {
          const generatedSlug = `${toSlug(name)}-${Date.now()}-${Math.floor(
            Math.random() * 1000
          )}`;
          const { data: inserted, error: insertError } = await client
            .from("products")
            .insert({
              name,
              slug: generatedSlug,
              category_id: categoryId,
              brand_id: brandId,
              description: description || null,
              is_archived: parseBooleanCell(row.is_archived ?? "", false),
            })
            .select("id")
            .single<{ id: string }>();
          if (insertError || !inserted) {
            throw new Error(insertError?.message ?? "Failed to create product");
          }
        }
      }

      const refreshed = await fetchProductList();
      setProducts(refreshed);
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading products...</div>;
  }

  return (
    <div className="min-h-screen space-y-4 p-6">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <ShadcnDataTable
        title="Products"
        data={sortedProducts}
        columns={columns}
        getRowId={(row) => row.id}
        getRowName={(row) => row.name}
        getRowCreatedAt={(row) => row.created_at}
        getRowCategory={(row) => row.category_name}
        onDeleteRows={handleDelete}
        deleting={deleting}
        emptyText="No products found."
        itemsPerPage={8}
        exportFileName="products"
        getExportRow={(row) => ({
          id: row.id,
          name: row.name,
          category: row.category_name,
          brand: row.brand_name,
          created_at: row.created_at,
        })}
        rowActions={(row) => (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-blue-600 hover:text-blue-700"
            onClick={() => openEditModal(row.id)}
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
            className="w-full max-w-xl rounded-xl border border-gray-200 bg-background p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">Create Product</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span>Name</span>
                <input
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 bg-background px-3"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span>Category</span>
                <select
                  value={newCategoryId}
                  onChange={(event) => setNewCategoryId(event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 bg-background px-3"
                >
                  <option value="">Select category</option>
                  {categoryOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span>Brand</span>
                <select
                  value={newBrandId}
                  onChange={(event) => setNewBrandId(event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 bg-background px-3"
                >
                  <option value="">Select brand</option>
                  {brandOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm md:col-span-2">
                <span>Description</span>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(event) => setNewDescription(event.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-background p-2"
                />
              </label>
              <label className="space-y-1 text-sm md:col-span-2">
                <span>External Image URLs (Optional)</span>
                <textarea
                  rows={4}
                  value={newImageUrls}
                  onChange={(event) => setNewImageUrls(event.target.value)}
                  placeholder="Paste image URLs (comma or new line separated)"
                  className="w-full rounded-md border border-gray-300 bg-background p-2"
                />
              </label>
              <label className="space-y-1 text-sm md:col-span-2">
                <span>Upload Images from Device (Optional)</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) =>
                    setNewImageFiles(event.target.files ? Array.from(event.target.files) : [])
                  }
                  className="block w-full rounded-md border border-gray-300 bg-background p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-emerald-700 file:px-3 file:py-2 file:text-white hover:file:bg-emerald-800"
                />
                {newImageFiles.length > 0 && (
                  <p className="text-xs text-gray-600">
                    {newImageFiles.length} file(s) selected.
                  </p>
                )}
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-emerald-700 text-white hover:bg-emerald-800"
                onClick={handleCreateProduct}
                disabled={creating}
              >
                {creating ? "Creating..." : "Create Product"}
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
            className="w-full max-w-xl rounded-xl border border-gray-200 bg-background p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">Update Product</h3>
            {editLoading ? (
              <p className="mt-4 text-sm text-gray-600">Loading product details...</p>
            ) : (
              <>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label className="space-y-1 text-sm">
                    <span>Name</span>
                    <input
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      className="h-10 w-full rounded-md border border-gray-300 bg-background px-3"
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span>Category</span>
                    <select
                      value={editCategoryId}
                      onChange={(event) => setEditCategoryId(event.target.value)}
                      className="h-10 w-full rounded-md border border-gray-300 bg-background px-3"
                    >
                      <option value="">Select category</option>
                      {categoryOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-sm">
                    <span>Brand</span>
                    <select
                      value={editBrandId}
                      onChange={(event) => setEditBrandId(event.target.value)}
                      className="h-10 w-full rounded-md border border-gray-300 bg-background px-3"
                    >
                      <option value="">Select brand</option>
                      {brandOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-sm md:col-span-2">
                    <span>Description</span>
                    <textarea
                      rows={3}
                      value={editDescription}
                      onChange={(event) => setEditDescription(event.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-background p-2"
                    />
                  </label>
                  <label className="space-y-1 text-sm md:col-span-2">
                    <span>Image URLs</span>
                    <textarea
                      rows={4}
                      value={editImageUrls}
                      onChange={(event) => setEditImageUrls(event.target.value)}
                      placeholder="Paste image URLs (comma or new line separated)"
                      className="w-full rounded-md border border-gray-300 bg-background p-2"
                    />
                  </label>
                  <label className="space-y-1 text-sm md:col-span-2">
                    <span>Upload Images from Device (Optional)</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(event) =>
                        setEditImageFiles(event.target.files ? Array.from(event.target.files) : [])
                      }
                      className="block w-full rounded-md border border-gray-300 bg-background p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-emerald-700 file:px-3 file:py-2 file:text-white hover:file:bg-emerald-800"
                    />
                    {editImageFiles.length > 0 && (
                      <p className="text-xs text-gray-600">
                        {editImageFiles.length} file(s) selected.
                      </p>
                    )}
                  </label>
                </div>
                {editError && <p className="mt-3 text-sm text-red-600">{editError}</p>}
                <div className="mt-5 flex justify-end gap-2">
                  <Button variant="outline" onClick={closeEditModal}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-emerald-700 text-white hover:bg-emerald-800"
                    onClick={handleUpdateProduct}
                    disabled={savingEdit}
                  >
                    {savingEdit ? "Saving..." : "Update Product"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <CsvImportModal
        open={importOpen}
        title="Import Products CSV"
        requiredHeaders={["name", "category", "brand"]}
        optionalHeaders={["description", "is_archived"]}
        importing={importing}
        onClose={() => setImportOpen(false)}
        onImport={handleImportProducts}
      />
    </div>
  );
};

export default Products;
