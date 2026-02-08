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
import { DataTable } from "../components/DataTable";
import { pendingOrderColumns } from "../tableColumnData/PendingOrderColumns";
import { lowStockColumns } from "../tableColumnData/LowStockItemColumns";

const Dashboard = () => {
  const [selectedOrder, setSelectedOrder] = useState<PendingOrderModel | LowStockItem | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [waitingOrders, setWaitingOrders] = useState<PendingOrderModel[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUserCount, setTotalUserCount] = useState<number>(0);
  const [lowStockItemCount, setLowStockItemCount] = useState<number>(0);
  const [pendingOrderCount, setPendingOrderCount] = useState<number>(0);
  const [todayOrderCount, setTodayOrderCount] = useState<number>(0);
  const [yesterdayOrderCount, setYesterdayOrderCount] = useState<number>(0);
  const [percentage, setPercentage] = useState<number>(0);

  // --- Pagination State ---
  const [orderPage, setOrderPage] = useState(1);
  const [stockPage, setStockPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // --- Derived State (Slicing the arrays) ---
  const currentOrders = waitingOrders.slice(
    (orderPage - 1) * ITEMS_PER_PAGE,
    orderPage * ITEMS_PER_PAGE
  );

  const currentStock = lowStockItems.slice(
    (stockPage - 1) * ITEMS_PER_PAGE,
    stockPage * ITEMS_PER_PAGE
  );

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
        setYesterdayOrderCount(yesterdayOrderCount);
        setPercentage(percentageCount);

      } catch (error) {
        console.log('Fetching data failed: ', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCounts();
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
      <div className="w-full grid place-items-center p-4 grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-8">
        <TrendCard icon={percentage < 0 ? faArrowTrendDown : faArrowTrendUp} amount={todayOrderCount} caption="Orders Today" percentage={percentage} />
        <TrendCard icon={faUser} amount={totalUserCount} caption="Total Users" />
        <TrendCard icon={faShoppingBag} amount={pendingOrderCount} caption="Pending Orders" />
        <TrendCard icon={faMobile} amount={lowStockItemCount} caption="Low Stock Items" />
      </div>
      
      {/* Section: Pending Orders */}
      <DataTable 
        title="Pending Orders"
        columns={pendingOrderColumns({
          onEdit: (order) => {
            setSelectedOrder(order);
            setIsEditOpen(true);
          },
          onDelete: (order) => {
            setSelectedOrder(order);
            setIsDeleteOpen(true);
            console.log('Order ID: ', order.id);
          }
        })}
        data={currentOrders}
        emptyText="No pending orders are found"
        pagination={{
          totalItems: waitingOrders.length,
          itemsPerPage: ITEMS_PER_PAGE,
          currentPage: orderPage,
          setCurrentPage: setOrderPage,
        }}
      />

      {/* Section: Low Stock Items */}
      <DataTable
        title="Low Stock Alert"
        columns={lowStockColumns({
          onEdit: (item) => {
            setSelectedOrder(item);
            setIsEditOpen(true);
          },
          onDelete: (item) => {
            setSelectedOrder(item);
            setIsDeleteOpen(true);
            console.log("item ID: ",item.id);
          }
        })}
        data={currentStock}    
        emptyText="Stock levels are healthy."
        pagination={{
          totalItems: lowStockItems.length,
          itemsPerPage: ITEMS_PER_PAGE,
          currentPage: stockPage,
          setCurrentPage: setStockPage,
        }}
      />
    </div>
  );
};

export default Dashboard;