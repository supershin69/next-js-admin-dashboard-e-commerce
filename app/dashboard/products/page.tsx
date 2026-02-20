"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/app/components/ui/badge";
import { ShadcnDataTable, ShadcnColumn } from "@/app/components/ShadcnDataTable";
import { ProductModel } from "@/app/interfaces/productModel";
import { fetchProductList } from "@/app/lib/fetchProductList";
import { deleteProducts } from "@/app/lib/deleteProducts";

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
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchProductList();
      setProducts(data);
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
      />
    </div>
  );
};

export default Products;
