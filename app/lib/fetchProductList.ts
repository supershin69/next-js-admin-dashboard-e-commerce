import client from "@/app/api/client";
import { ProductModel } from "@/app/interfaces/productModel";

type ProductQueryRow = {
  id: string;
  name: string;
  created_at: string;
  categories: { name: string } | null;
  brands: { name: string } | null;
};

export const fetchProductList = async (): Promise<ProductModel[]> => {
  const { data, error } = await client
    .from("products")
    .select("id, name, created_at, categories(name), brands(name)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  return ((data as ProductQueryRow[]) ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    created_at: item.created_at,
    category_name: item.categories?.name ?? "Uncategorized",
    brand_name: item.brands?.name ?? "Unknown",
  }));
};
