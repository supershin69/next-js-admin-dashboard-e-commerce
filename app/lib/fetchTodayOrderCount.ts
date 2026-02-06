import client from "../api/client";

export const fetchTodayOrderCount = async (): Promise<number> => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    
    const { count, error } = await client
                                    .from('orders')
                                    .select('*', {head: true, count: 'exact'})
                                    .gte('created_at', startOfToday.toISOString())
                                    .lte('created_at', endOfToday.toISOString());

    if(error) {
        console.log("Error fetching today order count: ", error);
    }

    console.log("Order Count: ", count);

    return count || 0;
}