import LowStockItem from "../interfaces/lowStockItem";

export const lowStockColumns = [
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
];