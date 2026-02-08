import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import LowStockItem from "../interfaces/lowStockItem";
import { LowStockItemActionHandler } from "../types/rowOperationTypes";
import { faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons";

export const lowStockColumns = ({
    onEdit,
    onDelete
}: LowStockItemActionHandler) => [
  {
    header: "ID",
    cell: (i: LowStockItem) => i.id,
    className: "font-medium whitespace-nowrap",
  },
  {
    header: "SKU",
    cell: (i: LowStockItem) => i.sku,
    className: "font-mono text-xs",
  },
  {
    header: "Quantity",
    cell: (i: LowStockItem) => (
      <span className="font-bold text-red-600 dark:text-red-400">
        {i.quantity}
      </span>
    ),
  },
  {
    header: "Updated",
    cell: (i: LowStockItem) => new Date(i.updated_at).toLocaleDateString(),
    className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
  },
    {
    header: "Actions",
    className: "text-right",
    cell: (i: LowStockItem) => (
      <div className="flex justify-end gap-2">
        <button
          onClick={() => onEdit(i)}
          className="rounded-md p-2 text-purple-600 hover:bg-purple-100 dark:hover:bg-white/10"
          title="Edit"
        >
          <FontAwesomeIcon icon={faPenToSquare} />
        </button>

        <button
          onClick={() => onDelete(i)}
          className="rounded-md p-2 text-red-600 hover:bg-red-100 dark:hover:bg-white/10"
          title="Delete"
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </div>
    ),
  },
];