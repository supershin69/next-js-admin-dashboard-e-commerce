import client from "../api/client";

export const fetchLowStockItemCount = async (): Promise<number> => {
    const { count, error } = await client
                                    .from('product_variants')
                                    .select("*", {count: 'exact', head: true})
                                    .lt('quantity', 10);
    
    if (error) {
        console.log('Error fetching low stock item count: ', error);
        return 0;
    }

    return count || 0;
}