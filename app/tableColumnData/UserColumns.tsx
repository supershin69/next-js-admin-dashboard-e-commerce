import { UserModel } from "../interfaces/userModel";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons";
import { UserActionHandler } from "../types/rowOperationTypes";

export const UserColumns = ({
    onEdit,
    onDelete
}: UserActionHandler) => [
    {
        header: 'ID',
        cell: (u: UserModel) => u.user_id,
        className: "font-medium whitespace-nowrap",
    },
    {
        header: 'Name',
        cell: (u: UserModel) => u.name,
        className: "font-medium whitespace-nowrap",
    },
    {
        header: 'Role',
        cell: (u: UserModel) => u.role,
        className: "font-medium whitespace-nowrap",
    },
    {
        header: "Created",
        cell: (u: UserModel) => new Date(u.created_at).toLocaleDateString(),
        className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
    },
    {
       header: "Updated",
          cell: (u: UserModel) => new Date(u.updated_at).toLocaleDateString(),
          className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
    },
    {
        header: "Actions",
        className: "text-right",
        cell: (u: UserModel) => (
          <div className="flex justify-end gap-2">
            <button
              onClick={() => onEdit(u)}
              className="rounded-md p-2 text-purple-600 hover:bg-purple-100 dark:hover:bg-white/10"
              title="Edit"
            >
              <FontAwesomeIcon icon={faPenToSquare} />
            </button>
    
            <button
              onClick={() => onDelete(u)}
              className="rounded-md p-2 text-red-600 hover:bg-red-100 dark:hover:bg-white/10"
              title="Delete"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        ),
      },

]
