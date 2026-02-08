import { UserModel } from "@/app/interfaces/userModel"
import client from "../api/client"
import { redirect } from "next/navigation";

export const fetchUserList = async (): Promise<UserModel[]> => {
    const { data: {user} } = await client.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await client
                                    .from('profiles')
                                    .select('*')
                                    .eq('user_id', user.id)
                                    .single<UserModel>();

    const role = profile?.role;

    if (role === 'staff') {
        const { data, error } = await client
                                        .from('profiles')
                                        .select('*')
                                        .eq('role', 'user');
        
        if (error) {
            console.log('Error fetching user list: ', error)
            return [];
        }

        return data as UserModel[];
    } else if (role === 'admin') {
        const { data, error } = await client
                                        .from('profiles')
                                        .select('*')
                                        .neq('role', 'admin')
                                        .neq('role', 'superadmin');

        if (error) {
            console.log('Error fetching user list: ', error)
            return [];
        }

        return data as UserModel[];
    } else if (role === 'superadmin') {
        const { data, error } = await client
                                        .from('profiles')
                                        .select('*')
                                        .neq('role', 'superadmin');

       if (error) {
            console.log('Error fetching user list: ', error)
            return [];
        }

        return data as UserModel[];
    }

    return []

}