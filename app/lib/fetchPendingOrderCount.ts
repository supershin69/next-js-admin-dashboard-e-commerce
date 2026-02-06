import client from "../api/client";

export const fetchPendingOrderCount = async (): Promise<number> => {
    const { count, error} = await client
                                .from('orders')
                                .select("*", { count: 'exact', head: true})
                                .eq('status', 'pending')
                        
    if (error) {
        console.log('Error fetching pending order count: ', error);
        return 0;
    }

    return count || 0;
}