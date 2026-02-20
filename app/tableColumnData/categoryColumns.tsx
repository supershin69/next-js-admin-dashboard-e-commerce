import { CategoryActionHandler } from "../types/rowOperationTypes";
import { CategoryModel } from "../interfaces/categoryModel";
import { faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";

export const categoryColumn = ({
    onEdit,
    onDelete
}: CategoryActionHandler) => [
    {
        header: 'ID',
        cell: (c: CategoryModel) => c.id,
        className: "font-medium whitespace-nowrap",
    },
    {
        header: 'Name',
        cell: (c: CategoryModel) => c.name,
        className: "font-medium whitespace-nowrap",
    },
    {
        header: 'Image',
        cell: (c: CategoryModel) => (
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md">
                <Image
                    src={c.image_url}
                    alt="Category Image"
                    fill
                    sizes="40px"
                    className="object-contain"
                />
                </div>
            ),
        className: "whitespace-nowrap"
    },
    {
        header: "Created",
        cell: (c: CategoryModel) => new Date(c.created_at).toLocaleDateString(),
        className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
    },
    {
        header: "Actions",
        className: "text-right",
        cell: (c: CategoryModel) => (
          <div className="flex justify-end gap-2">
            <button
              onClick={() => onEdit(c)}
              className="rounded-md p-2 text-purple-600 hover:bg-purple-100 dark:hover:bg-white/10"
              title="Edit"
            >
              <FontAwesomeIcon icon={faPenToSquare} />
            </button>
    
            <button
              onClick={() => onDelete(c)}
              className="rounded-md p-2 text-red-600 hover:bg-red-100 dark:hover:bg-white/10"
              title="Delete"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        ),
      },
];