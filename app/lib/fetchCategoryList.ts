import { CategoryModel } from "../interfaces/categoryModel";
import client from "../api/client";

export const fetchCategoryList = async (): Promise<CategoryModel[]> => {
    const { data, error } = await client.from('categories').select('*');

    if (error) {
        console.log('Error fetching categories: ', error);
        return [];
    }

    return data || [];
}