import PendingOrderModel from "../interfaces/pendingOrderModel"

export const pendingOrderColumns = [
  {
    header: "ID",
    cell: (o: PendingOrderModel) => o.id,
    className: "font-medium whitespace-nowrap",
  },
  {
    header: "Name",
    cell: (o: PendingOrderModel) => o.name,
  },
  {
    header: "Total",
    cell: (o: PendingOrderModel) => (
      <span className="font-medium text-light-purple">
        {o.total_amount}
      </span>
    ),
  },
  {
    header: "Status",
    cell: (o: PendingOrderModel) => (
      <span className="inline-flex rounded-md px-2 py-1 text-sm font-medium dark:bg-yellow-400/90 dark:text-white">
        {o.status}
      </span>
    ),
  },
  {
    header: "Payment",
    cell: (o: PendingOrderModel) => (
      <span
        className={`inline-flex rounded-md px-2 py-1 text-sm font-medium text-white
          ${o.payment_status === "pending" && "bg-yellow-400"}
          ${o.payment_status === "paid" && "bg-green-400"}
          ${o.payment_status === "failed" && "bg-red-500"}`}
      >
        {o.payment_status}
      </span>
    ),
  },
  {
    header: "Shipping Method",
    cell: (o: PendingOrderModel) => o.shipping_method,
    className: "max-w-36 truncate text-gray-500 dark:text-gray-400",
  },
  {
    header: "Payment Method",
    cell: (o: PendingOrderModel) => o.payment_method,
    className: "max-w-36 truncate text-gray-500 dark:text-gray-400",
  },
  {
    header: "Address",
    cell: (o: PendingOrderModel) => `${o.street}, ${o.city}`,
    className: "max-w-36 truncate text-gray-500 dark:text-gray-400",
  },
  {
    header: "Created",
    cell: (o: PendingOrderModel) => new Date(o.created_at).toLocaleDateString(),
    className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
  },
];