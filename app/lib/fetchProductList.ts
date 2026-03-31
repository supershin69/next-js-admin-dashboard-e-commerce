import client from "@/app/api/client";
import { ProductModel } from "@/app/interfaces/productModel";

type ProductQueryRow = {
  id: string;
  name: string;
  created_at: string;
  categories: { name: string } | Array<{ name: string }> | null;
  brands: { name: string } | Array<{ name: string }> | null;
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

  return ((data as ProductQueryRow[]) ?? []).map((item) => {
    const category = Array.isArray(item.categories) ? item.categories[0] : item.categories;
    const brand = Array.isArray(item.brands) ? item.brands[0] : item.brands;

    return {
    id: item.id,
    name: item.name,
    created_at: item.created_at,
    category_name: category?.name ?? "Uncategorized",
    brand_name: brand?.name ?? "Unknown",
  };
  });
};
