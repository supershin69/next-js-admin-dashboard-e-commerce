"use client";

import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileImport, faPlus } from "@fortawesome/free-solid-svg-icons";
import { Badge, BadgeProps } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { ShadcnDataTable, ShadcnColumn } from "@/app/components/ShadcnDataTable";
import { OrderModel } from "@/app/interfaces/orderModel";
import { fetchOrderList } from "@/app/lib/fetchOrderList";
import { deleteOrders } from "@/app/lib/deleteOrders";
import client from "@/app/api/client";
import { CsvImportModal } from "@/app/components/CsvImportModal";
import { CsvRow } from "@/app/lib/csv";

const getOrderStatusVariant = (status: string): NonNullable<BadgeProps["variant"]> => {
  const normalized = status.toLowerCase();
  if (normalized === "cancelled" || normalized === "canceled") return "danger";
  if (normalized === "pending") return "warning";
  if (normalized === "processing") return "processing";
  if (normalized === "shipped") return "info";
  if (normalized === "delivered") return "success";
  return "secondary";
};

const getDeliveryFeeStatusVariant = (
  status: string
): NonNullable<BadgeProps["variant"]> => {
  const normalized = status?.toLowerCase?.() ?? "";
  if (normalized === "pending_fee") return "warning";
  if (normalized === "fee_set") return "info";
  if (normalized === "customer_accepted") return "success";
  if (normalized === "customer_rejected") return "danger";
  return "secondary";
};

const formatDeliveryFeeStatus = (status: string) =>
  status ? status.replace(/_/g, " ") : "unknown";

const DELIVERY_FEE_STATUS_OPTIONS = [
  "pending_fee",
  "fee_set",
  "customer_accepted",
  "customer_rejected",
];

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
    cell: (order) => `MMK ${(order.total_amount).toLocaleString()}`,
  },
  {
    key: "delivery_fee",
    header: "Delivery Fee",
    cell: (order) =>
      order.delivery_fee !== null
        ? `MMK ${(order.delivery_fee).toLocaleString()}`
        : "—",
  },
  {
    key: "delivery_fee_status",
    header: "Fee Status",
    cell: (order) => (
      <Badge variant={getDeliveryFeeStatusVariant(order.delivery_fee_status)}>
        {formatDeliveryFeeStatus(order.delivery_fee_status)}
      </Badge>
    ),
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
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newTotalAmount, setNewTotalAmount] = useState("");
  const [newStatus, setNewStatus] = useState("pending");
  const [newPaymentStatus, setNewPaymentStatus] = useState("pending");
  const [feeFilter, setFeeFilter] = useState("all");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderModel | null>(null);
  const [deliveryFee, setDeliveryFee] = useState("");
  const [deliveryFeeStatus, setDeliveryFeeStatus] = useState("fee_set");
  const [confirmingOrder, setConfirmingOrder] = useState(false);
  const [confirmError, setConfirmError] = useState("");

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

  const feeFilteredOrders = useMemo(() => {
    if (feeFilter === "all") return sortedOrders;
    return sortedOrders.filter((order) => order.delivery_fee_status === feeFilter);
  }, [sortedOrders, feeFilter]);

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

  const openConfirmModal = (order: OrderModel) => {
    const initialStatus =
      order.delivery_fee_status === "pending_fee" ? "fee_set" : order.delivery_fee_status;
    setSelectedOrder(order);
    setDeliveryFee(order.delivery_fee !== null ? String(order.delivery_fee) : "");
    setDeliveryFeeStatus(initialStatus);
    setConfirmError("");
    setConfirmOpen(true);
  };

  const closeConfirmModal = () => {
    setConfirmOpen(false);
    setSelectedOrder(null);
    setDeliveryFee("");
    setDeliveryFeeStatus("fee_set");
    setConfirmError("");
  };

  const handleConfirmOrder = async () => {
    if (!selectedOrder) return;
    const trimmedFee = deliveryFee.trim();
    const feeValue = trimmedFee === "" ? null : Number(trimmedFee);

    if (trimmedFee && (Number.isNaN(feeValue) || feeValue < 0)) {
      setConfirmError("Delivery fee must be a non-negative number.");
      return;
    }

    if (deliveryFeeStatus !== "pending_fee" && feeValue === null) {
      setConfirmError("Delivery fee is required when fee status is not pending.");
      return;
    }

    setConfirmingOrder(true);
    setConfirmError("");
    try {
      const payload: Record<string, unknown> = {
        delivery_fee_status: deliveryFeeStatus,
        delivery_fee: feeValue,
      };
      if (selectedOrder.status === "pending") {
        payload.status = "processing";
      }

      const { error } = await client
        .from("orders")
        .update(payload)
        .eq("id", selectedOrder.id);

      if (error) {
        throw new Error(error.message);
      }

      const nextStatus = selectedOrder.status === "pending" ? "processing" : selectedOrder.status;
      setOrders((prev) =>
        prev.map((row) =>
          row.id === selectedOrder.id
            ? {
                ...row,
                status: nextStatus,
                delivery_fee_status: deliveryFeeStatus,
                delivery_fee: feeValue,
              }
            : row
        )
      );
      closeConfirmModal();
    } catch (error) {
      setConfirmError(error instanceof Error ? error.message : "Failed to update order");
    } finally {
      setConfirmingOrder(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!newUserId.trim() || !newTotalAmount.trim()) {
      setError("User ID and total amount are required.");
      return;
    }

    setCreating(true);
    setError("");
    try {
      const { data, error: createError } = await client
        .from("orders")
        .insert({
          user_id: newUserId.trim(),
          customer_name: newCustomerName.trim() || null,
          total_amount: Number(newTotalAmount),
          status: newStatus,
          payment_status: newPaymentStatus,
        })
        .select("id, customer_name, status, payment_status, total_amount, delivery_fee_status, delivery_fee, created_at")
        .single<OrderModel>();

      if (createError || !data) {
        throw new Error(createError?.message ?? "Failed to create order");
      }

      setOrders((prev) => [data, ...prev]);
      setCreateOpen(false);
      setNewUserId("");
      setNewCustomerName("");
      setNewTotalAmount("");
      setNewStatus("pending");
      setNewPaymentStatus("pending");
    } catch (createOrderError) {
      setError(createOrderError instanceof Error ? createOrderError.message : "Create failed");
    } finally {
      setCreating(false);
    }
  };

  const resolveUserIdByName = async (name: string) => {
    const { data, error: queryError } = await client
      .from("profiles")
      .select("user_id")
      .eq("name", name);
    if (queryError) throw new Error(queryError.message);
    const rows = (data ?? []) as Array<{ user_id: string }>;
    if (rows.length === 0) throw new Error(`No profile found for user_name: ${name}`);
    if (rows.length > 1) throw new Error(`Multiple users found for user_name: ${name}`);
    return rows[0].user_id;
  };

  const handleImportOrders = async (rows: CsvRow[]) => {
    setImporting(true);
    setError("");
    try {
      for (const row of rows) {
        const userIdValue = row.user_id?.trim();
        const userNameValue = row.user_name?.trim();
        const totalAmountValue = row.total_amount?.trim();
        const status = row.status?.trim() || "pending";
        const paymentStatus = row.payment_status?.trim() || "pending";
        const customerName = row.customer_name?.trim() || null;
        const transactionId = row.transaction_id?.trim() || null;

        if (!totalAmountValue) {
          throw new Error("Each row must include total_amount.");
        }

        let userId = userIdValue;
        if (!userId && userNameValue) {
          userId = await resolveUserIdByName(userNameValue);
        }
        if (!userId) {
          throw new Error("Each row must include user_id or user_name.");
        }

        const shippingStreet = row.street?.trim() ?? "";
        const shippingCity = row.city?.trim() ?? "";
        const shippingAddress =
          shippingStreet && shippingCity ? { street: shippingStreet, city: shippingCity } : null;

        const payload = {
          user_id: userId,
          total_amount: Number(totalAmountValue),
          status,
          payment_status: paymentStatus,
          customer_name: customerName,
          transaction_id: transactionId,
          payment_method: row.payment_method?.trim() || "cash-on-delivery",
          shipping_method: row.shipping_method?.trim() || "standard",
          shipping_address: shippingAddress,
        };

        if (transactionId) {
          const { data: existing, error: existingError } = await client
            .from("orders")
            .select("id")
            .eq("transaction_id", transactionId)
            .maybeSingle<{ id: string }>();
          if (existingError) throw new Error(existingError.message);

          if (existing?.id) {
            const { error: updateError } = await client
              .from("orders")
              .update(payload)
              .eq("id", existing.id);
            if (updateError) throw new Error(updateError.message);
          } else {
            const { error: insertError } = await client.from("orders").insert(payload);
            if (insertError) throw new Error(insertError.message);
          }
        } else {
          const { error: insertError } = await client.from("orders").insert(payload);
          if (insertError) throw new Error(insertError.message);
        }
      }

      const refreshed = await fetchOrderList();
      setOrders(refreshed);
    } finally {
      setImporting(false);
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
        data={feeFilteredOrders}
        columns={columns}
        getRowId={(row) => row.id}
        getRowName={(row) => row.customer_name ?? row.id}
        getRowCreatedAt={(row) => row.created_at}
        getRowCategory={(row) => row.status}
        rowActions={(row) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => openConfirmModal(row)}
            disabled={confirmingOrder}
          >
            {row.delivery_fee_status === "pending_fee" && row.delivery_fee === null
              ? "Confirm & Set Fee"
              : "Update Fee"}
          </Button>
        )}
        onDeleteRows={handleDelete}
        deleting={deleting}
        emptyText="No orders found."
        categoryLabel="Status"
        itemsPerPage={8}
        exportFileName="orders"
        getExportRow={(row) => ({
          id: row.id,
          customer_name: row.customer_name ?? "",
          status: row.status,
          payment_status: row.payment_status,
          total_amount: row.total_amount,
          delivery_fee_status: row.delivery_fee_status,
          delivery_fee: row.delivery_fee,
          created_at: row.created_at,
        })}
        toolbarActions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Fee Status</span>
              <select
                value={feeFilter}
                onChange={(event) => setFeeFilter(event.target.value)}
                className="h-10 rounded-md border border-gray-300 bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-gray-900/20"
              >
                <option value="all">All</option>
                {DELIVERY_FEE_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {formatDeliveryFeeStatus(status)}
                  </option>
                ))}
              </select>
            </div>
            <Button variant="outline" className="gap-2" onClick={() => setImportOpen(true)}>
              <FontAwesomeIcon icon={faFileImport} />
              Import CSV
            </Button>
            <Button
              className="gap-2 bg-emerald-700 text-white hover:bg-emerald-800"
              onClick={() => setCreateOpen(true)}
            >
              <FontAwesomeIcon icon={faPlus} />
              Create New
            </Button>
          </div>
        }
      />

      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setCreateOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-xl border border-gray-200 bg-background p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">Create Order</h3>
            <p className="mt-1 text-sm text-gray-600">Provide a valid user ID.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span>User ID</span>
                <input
                  value={newUserId}
                  onChange={(event) => setNewUserId(event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 bg-background px-3"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span>Customer Name</span>
                <input
                  value={newCustomerName}
                  onChange={(event) => setNewCustomerName(event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 bg-background px-3"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span>Total Amount (MMK)</span>
                <input
                  type="number"
                  min="0"
                  value={newTotalAmount}
                  onChange={(event) => setNewTotalAmount(event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 bg-background px-3"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span>Status</span>
                <select
                  value={newStatus}
                  onChange={(event) => setNewStatus(event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 bg-background px-3"
                >
                  <option value="pending">pending</option>
                  <option value="processing">processing</option>
                  <option value="shipped">shipped</option>
                  <option value="delivered">delivered</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span>Payment Status</span>
                <select
                  value={newPaymentStatus}
                  onChange={(event) => setNewPaymentStatus(event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 bg-background px-3"
                >
                  <option value="pending">pending</option>
                  <option value="paid">paid</option>
                  <option value="failed">failed</option>
                </select>
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-emerald-700 text-white hover:bg-emerald-800"
                onClick={handleCreateOrder}
                disabled={creating}
              >
                {creating ? "Creating..." : "Create Order"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmOpen && selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={closeConfirmModal}
        >
          <div
            className="w-full max-w-xl rounded-xl border border-gray-200 bg-background p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">Confirm Order & Set Delivery Fee</h3>
            <p className="mt-1 text-sm text-gray-600">
              Order {selectedOrder.id} • {selectedOrder.customer_name ?? "Customer"}
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span>Delivery Fee (MMK)</span>
                <input
                  type="number"
                  min="0"
                  value={deliveryFee}
                  onChange={(event) => setDeliveryFee(event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 bg-background px-3"
                  disabled={confirmingOrder}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span>Delivery Fee Status</span>
                <select
                  value={deliveryFeeStatus}
                  onChange={(event) => setDeliveryFeeStatus(event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 bg-background px-3"
                  disabled={confirmingOrder}
                >
                  {DELIVERY_FEE_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {formatDeliveryFeeStatus(status)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {confirmError && <p className="mt-3 text-sm text-red-600">{confirmError}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={closeConfirmModal} disabled={confirmingOrder}>
                Cancel
              </Button>
              <Button
                className="bg-emerald-700 text-white hover:bg-emerald-800"
                onClick={handleConfirmOrder}
                disabled={confirmingOrder}
              >
                {confirmingOrder ? "Saving..." : "Confirm Order"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <CsvImportModal
        open={importOpen}
        title="Import Orders CSV"
        requiredHeaders={["total_amount", "status", "payment_status"]}
        optionalHeaders={[
          "user_id",
          "user_name",
          "customer_name",
          "transaction_id",
          "street",
          "city",
          "payment_method",
          "shipping_method",
        ]}
        importing={importing}
        onClose={() => setImportOpen(false)}
        onImport={handleImportOrders}
      />
    </div>
  );
};

export default Orders;
