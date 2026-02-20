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
import { Badge } from "../components/ui/badge";
import { deleteOrders } from "../lib/deleteOrders";
import { deleteProductVariants } from "../lib/deleteProductVariants";

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
    cell: (order) => `MMK ${(order.total_amount / 100).toLocaleString()}`,
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
        onDeleteRows={handleDeleteOrders}
        deleting={deletingOrders}
        emptyText="No pending orders are found"
        categoryLabel="Status"
        itemsPerPage={5}
      />

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
      />
    </div>
  );
};

export default Dashboard;
