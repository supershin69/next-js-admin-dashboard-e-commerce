import client from "../api/client";

export const fetchTotalUsers = async (): Promise<number> => {
    const { count, error } = await client
                                    .from('profiles')
                                    .select("*" , { count: 'exact', head: true });
    
    if (error) {
        console.log('Error fetching total users: ', error);
        return 0;
    }

    return count || 0;
}