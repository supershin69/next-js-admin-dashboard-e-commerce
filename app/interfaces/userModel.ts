export interface UserModel {
    user_id: string
    name: string
    role: 'staff' | 'admin' | 'superadmin' | 'user'
    created_at: string
    updated_at: string
}