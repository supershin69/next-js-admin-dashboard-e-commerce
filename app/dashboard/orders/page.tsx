"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/app/components/ui/badge";
import { BadgeProps } from "@/app/components/ui/badge";
import { ShadcnDataTable, ShadcnColumn } from "@/app/components/ShadcnDataTable";
import { OrderModel } from "@/app/interfaces/orderModel";
import { fetchOrderList } from "@/app/lib/fetchOrderList";
import { deleteOrders } from "@/app/lib/deleteOrders";

const getOrderStatusVariant = (status: string): NonNullable<BadgeProps["variant"]> => {
  const normalized = status.toLowerCase();
  if (normalized === "cancelled" || normalized === "canceled") return "danger";
  if (normalized === "pending") return "warning";
  if (normalized === "processing") return "processing";
  if (normalized === "shipped") return "info";
  if (normalized === "delivered") return "success";
  return "secondary";
};

const columns: ShadcnColumn<OrderModel>[] = [
  {
    key: "id",
    header: "Order ID",
    cell: (order) => <span className="font-mono text-xs">{order.id}</span>,
  },
  {
    key: "customer_name",
    header: "Customer",
    cell: (order) => order.customer_name ?? "N/A",
  },
  {
    key: "total_amount",
    header: "Total",
    cell: (order) => `MMK ${(order.total_amount / 100).toLocaleString()}`,
  },
  {
    key: "status",
    header: "Status",
    cell: (order) => <Badge variant={getOrderStatusVariant(order.status)}>{order.status}</Badge>,
  },
  {
    key: "created_at",
    header: "Created",
    cell: (order) => new Date(order.created_at).toLocaleDateString(),
  },
];

const Orders = () => {
  const [orders, setOrders] = useState<OrderModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchOrderList();
      setOrders(data);
      setLoading(false);
    };
    load();
  }, []);

  const sortedOrders = useMemo(
    () =>
      [...orders].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [orders]
  );

  const handleDelete = async (ids: string[]) => {
    setDeleting(true);
    setError("");
    try {
      await deleteOrders(ids);
      setOrders((prev) => prev.filter((row) => !ids.includes(row.id)));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading orders...</div>;
  }

  return (
    <div className="min-h-screen space-y-4 p-6">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <ShadcnDataTable
        title="Orders"
        data={sortedOrders}
        columns={columns}
        getRowId={(row) => row.id}
        getRowName={(row) => row.customer_name ?? row.id}
        getRowCreatedAt={(row) => row.created_at}
        getRowCategory={(row) => row.status}
        onDeleteRows={handleDelete}
        deleting={deleting}
        emptyText="No orders found."
        categoryLabel="Status"
        itemsPerPage={8}
      />
    </div>
  );
};

export default Orders;
