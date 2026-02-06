import client from "../api/client";
import LowStockItem from "../interfaces/lowStockItem";

export const fetchLowStockItems = async (): Promise<LowStockItem[]> => {
    const { data, error } = await client
                                .from('product_variants')
                                .select('id, sku, quantity, created_at, updated_at')
                                .lt('quantity', 10);

    if (error) {
        console.log('Error fetching low stock items: ', error);
        return [];
    }

    return data || [];
}