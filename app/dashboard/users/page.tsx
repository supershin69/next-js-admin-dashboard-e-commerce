"use client"
import { DataTable } from "@/app/components/DataTable";
import { UserModel } from "@/app/interfaces/userModel"
import { fetchUserList } from "@/app/lib/fetchUserList";
import { useState, useEffect } from "react"
import { UserColumns } from "@/app/tableColumnData/UserColumns";

const Users = () => {
  const [ loading, setLoading ] = useState<boolean>(false);
  const [ users, setUsers ] = useState<UserModel[]>([]);
  const [ selectedUser, setSelectedUser ] = useState<UserModel | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [ userPage, setUserPage ] = useState(1);
  const ITEMS_PER_PAGE = 10;

    const currentUsers = users.slice(
    (userPage - 1) * ITEMS_PER_PAGE,
    userPage* ITEMS_PER_PAGE
  );

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const userList = await fetchUserList();
        setUsers(userList);

      } catch (error) {
        console.log('Fetching data failed: ', error);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        <div className="animate-pulse text-light-purple">Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background p-6 text-foreground transition-colors duration-300">
      <button className="w-full text-center text-white text-xl bg-green-700 hover:bg-green-800 py-3 mb-4 rounded-lg">
        Add New User
      </button>
      <DataTable
        title="Users"
        columns={UserColumns({
          onEdit: (user) => {
            setSelectedUser(user);
            setIsEditOpen(true);
            console.log('User to be edited: ', user.user_id);
          },
          onDelete: (user) => {
            setSelectedUser(user);
            setIsDeleteOpen(true);
            console.log('User to be deleted: ', user.user_id);

          }
        })}
        data={currentUsers}
        emptyText="No users found."
        pagination={{totalItems: users.length,
          itemsPerPage: ITEMS_PER_PAGE,
          currentPage: userPage,
          setCurrentPage: setUserPage,
        }}
      />

    </div>
  )
}
export default Users