"use client";
import { useState, useEffect } from "react";
import PendingOrderModel from "../interfaces/pendingOrderModel";
import LowStockItem from "../interfaces/lowStockItem";
import { fetchLowStockItems } from "../lib/fetchLowStockItem";
import { fetchWaitingOrders } from "../lib/fetchWaitingOrders";
import TrendCard from "../components/TrendCard";
import { faArrowTrendDown, faArrowTrendUp, faMobile, faShoppingBag, faUser } from "@fortawesome/free-solid-svg-icons";
import { fetchTotalUsers } from "../lib/fetchTotalUsers";
import { fetchLowStockItemCount } from "../lib/fetchLowStockItemCount";
import { fetchPendingOrderCount } from "../lib/fetchPendingOrderCount";
import { fetchTodayOrderCount } from "../lib/fetchTodayOrderCount";
import { fetchYesterdayOrderCount } from "../lib/fetchYesterdayOrderCount";
import { getOrderCountComparison } from "../lib/orderComparison";
import { ShadcnColumn, ShadcnDataTable } from "../components/ShadcnDataTable";
import { Badge, BadgeProps } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { deleteOrders } from "../lib/deleteOrders";
import { deleteProductVariants } from "../lib/deleteProductVariants";
import client from "../api/client";

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

const pendingOrderColumns: ShadcnColumn<PendingOrderModel>[] = [
  {
    key: "id",
    header: "Order ID",
    cell: (order) => <span className="font-mono text-xs">{order.id}</span>,
  },
  {
    key: "name",
    header: "Customer",
    cell: (order) => order.name,
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
    cell: (order) => <Badge variant="warning">{order.status}</Badge>,
  },
  {
    key: "created_at",
    header: "Created",
    cell: (order) => new Date(order.created_at).toLocaleDateString(),
  },
];

const lowStockColumns: ShadcnColumn<LowStockItem>[] = [
  {
    key: "id",
    header: "Variant ID",
    cell: (item) => <span className="font-mono text-xs">{item.id}</span>,
  },
  {
    key: "sku",
    header: "SKU",
    cell: (item) => item.sku,
  },
  {
    key: "quantity",
    header: "Quantity",
    cell: (item) => (
      <Badge variant={item.quantity <= 3 ? "danger" : "warning"}>
        {item.quantity}
      </Badge>
    ),
  },
  {
    key: "updated_at",
    header: "Updated",
    cell: (item) => new Date(item.updated_at).toLocaleDateString(),
  },
];

const Dashboard = () => {
  const [waitingOrders, setWaitingOrders] = useState<PendingOrderModel[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUserCount, setTotalUserCount] = useState<number>(0);
  const [lowStockItemCount, setLowStockItemCount] = useState<number>(0);
  const [pendingOrderCount, setPendingOrderCount] = useState<number>(0);
  const [todayOrderCount, setTodayOrderCount] = useState<number>(0);
  const [percentage, setPercentage] = useState<number>(0);
  const [deletingOrders, setDeletingOrders] = useState(false);
  const [deletingStock, setDeletingStock] = useState(false);
  const [tableError, setTableError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PendingOrderModel | null>(null);
  const [deliveryFee, setDeliveryFee] = useState("");
  const [deliveryFeeStatus, setDeliveryFeeStatus] = useState("fee_set");
  const [confirmingOrder, setConfirmingOrder] = useState(false);
  const [confirmError, setConfirmError] = useState("");

  useEffect(() => {
    const getData = async () => {
      try {
        setLoading(true);
        // Fetch both in parallel for speed
        const [orders, stock] = await Promise.all([
          fetchWaitingOrders(),
          fetchLowStockItems()
        ]);
        setWaitingOrders(orders);
        setLowStockItems(stock);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, []);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setLoading(true);

        const [userCount, lowStockItemCount, pendingOrderCount, todayOrderCount, yesterdayOrderCount] = await Promise.all([
          fetchTotalUsers(),
          fetchLowStockItemCount(),
          fetchPendingOrderCount(),
          fetchTodayOrderCount(),
          fetchYesterdayOrderCount()
        ]);

        const percentageCount = getOrderCountComparison(todayOrderCount, yesterdayOrderCount);

        setTotalUserCount(userCount);
        setLowStockItemCount(lowStockItemCount);
        setPendingOrderCount(pendingOrderCount);
        setTodayOrderCount(todayOrderCount);
        setPercentage(percentageCount);

      } catch (error) {
        console.log('Fetching data failed: ', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCounts();
  }, []);

  const handleDeleteOrders = async (ids: string[]) => {
    setDeletingOrders(true);
    setTableError("");
    try {
      await deleteOrders(ids);
      setWaitingOrders((prev) => prev.filter((row) => !ids.includes(row.id)));
    } catch (error) {
      setTableError(error instanceof Error ? error.message : "Failed to delete orders");
    } finally {
      setDeletingOrders(false);
    }
  };

  const handleDeleteStockItems = async (ids: string[]) => {
    setDeletingStock(true);
    setTableError("");
    try {
      await deleteProductVariants(ids);
      setLowStockItems((prev) => prev.filter((row) => !ids.includes(row.id)));
    } catch (error) {
      setTableError(error instanceof Error ? error.message : "Failed to delete variants");
    } finally {
      setDeletingStock(false);
    }
  };

  const openConfirmModal = (order: PendingOrderModel) => {
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
      const { error } = await client
        .from("orders")
        .update({
          status: "processing",
          delivery_fee_status: deliveryFeeStatus,
          delivery_fee: feeValue,
        })
        .eq("id", selectedOrder.id);

      if (error) {
        throw new Error(error.message);
      }

      setWaitingOrders((prev) => prev.filter((row) => row.id !== selectedOrder.id));
      setPendingOrderCount((prev) => Math.max(0, prev - 1));
      closeConfirmModal();
    } catch (error) {
      setConfirmError(error instanceof Error ? error.message : "Failed to confirm order");
    } finally {
      setConfirmingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        <div className="animate-pulse text-light-purple">Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background p-6 text-foreground transition-colors duration-300">
      <div className="w-full grid place-items-center p-4 grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-8">
        <TrendCard icon={percentage < 0 ? faArrowTrendDown : faArrowTrendUp} amount={todayOrderCount} caption="Orders Today" percentage={percentage} />
        <TrendCard icon={faUser} amount={totalUserCount} caption="Total Users" />
        <TrendCard icon={faShoppingBag} amount={pendingOrderCount} caption="Pending Orders" />
        <TrendCard icon={faMobile} amount={lowStockItemCount} caption="Low Stock Items" />
      </div>

      {tableError && <p className="mb-3 text-sm text-red-600">{tableError}</p>}

      <ShadcnDataTable
        title="Pending Orders"
        columns={pendingOrderColumns}
        data={waitingOrders}
        getRowId={(row) => row.id}
        getRowName={(row) => row.name}
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
        onDeleteRows={handleDeleteOrders}
        deleting={deletingOrders}
        emptyText="No pending orders are found"
        categoryLabel="Status"
        itemsPerPage={5}
        exportFileName="pending-orders"
        getExportRow={(row) => ({
          id: row.id,
          customer_name: row.name,
          total_amount: row.total_amount,
          delivery_fee_status: row.delivery_fee_status,
          delivery_fee: row.delivery_fee,
          status: row.status,
          payment_status: row.payment_status,
          shipping_method: row.shipping_method,
          payment_method: row.payment_method,
          street: row.street,
          city: row.city,
          created_at: row.created_at,
          updated_at: row.updated_at,
        })}
      />
      <div className="mb-4"></div>

      <ShadcnDataTable
        title="Low Stock Alert"
        columns={lowStockColumns}
        data={lowStockItems}
        getRowId={(row) => row.id}
        getRowName={(row) => row.sku}
        getRowCreatedAt={(row) => row.updated_at}
        getRowCategory={(row) => (row.quantity <= 3 ? "Critical" : "Low")}
        onDeleteRows={handleDeleteStockItems}
        deleting={deletingStock}
        emptyText="Stock levels are healthy."
        itemsPerPage={5}
        exportFileName="low-stock-items"
        getExportRow={(row) => ({
          id: row.id,
          sku: row.sku,
          quantity: row.quantity,
          created_at: row.created_at,
          updated_at: row.updated_at,
        })}
      />

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
              Order {selectedOrder.id} • {selectedOrder.name}
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
    </div>
  );
};

export default Dashboard;
