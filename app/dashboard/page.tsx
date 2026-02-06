"use client";
import { useState, useEffect } from "react";
import PendingOrderModel from "../interfaces/pendingOrderModel";
import LowStockItem from "../interfaces/lowStockItem";
import { fetchLowStockItems } from "../lib/fetchLowStockItem";
import { fetchWaitingOrders } from "../lib/fetchWaitingOrders";
import { PaginationControls } from "../components/PaginationControls";
import TrendCard from "../components/TrendCard";
import { faUser } from "@fortawesome/free-solid-svg-icons";

const userCount = 5;
const caption = "Total Users";
const percentage = 30;



const Dashboard = () => {
  const [waitingOrders, setWaitingOrders] = useState<PendingOrderModel[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);

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
        <TrendCard icon={faUser} amount={userCount} caption={caption}/>
        <TrendCard icon={faUser} amount={userCount} caption={caption}/>
        <TrendCard icon={faUser} amount={userCount} caption={caption}/>
        <TrendCard icon={faUser} amount={userCount} caption={caption}/>
      </div>
      
      {/* Section: Pending Orders */}
      <div className="mb-8 space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Pending Orders
        </h2>
        
        <div className="w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm dark:border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 dark:bg-white/5 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">ID</th>
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Total</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Payment</th>
                  <th className="px-6 py-4 font-semibold">Address</th>
                  <th className="px-6 py-4 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                {currentOrders.length > 0 ? (
                  currentOrders.map((order) => (
                    <tr 
                      key={order.id} 
                      className="group transition-colors hover:bg-light-purple/5 dark:hover:bg-white/5"
                    >
                      <td className="whitespace-nowrap px-6 py-4 font-medium">{order.id}</td>
                      <td className="px-6 py-4">{order.name}</td>
                      <td className="px-6 py-4 font-medium text-light-purple">
                        {order.total_amount}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-md px-2 py-1 text-sm font-medium dark:bg-yellow-400/90 dark:text-white">
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                         <span className={`inline-flex items-center rounded-md ${order.payment_status == 'pending' && 'bg-yellow-400'} ${order.payment_status == 'paid' && 'bg-green-400'} ${order.payment_status == 'failed' && 'bg-red-500'} text-white px-2 py-1 text-sm font-medium`}>
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 max-w-36 truncate" title={order.shipping_address}>
                        {order.shipping_address}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-gray-500 dark:text-gray-400">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No pending orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls for Orders */}
          <PaginationControls 
            totalItems={waitingOrders.length}
            itemsPerPage={ITEMS_PER_PAGE}
            currentPage={orderPage}
            setCurrentPage={setOrderPage}
          />
        </div>
      </div>

      {/* Section: Low Stock Items */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Low Stock Alert
        </h2>

        <div className="w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm dark:border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 dark:bg-white/5 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">ID</th>
                  <th className="px-6 py-4 font-semibold">SKU</th>
                  <th className="px-6 py-4 font-semibold">Quantity</th>
                  <th className="px-6 py-4 font-semibold">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                {currentStock.length > 0 ? (
                  currentStock.map((item) => (
                    <tr 
                      key={item.id} 
                      className="transition-colors hover:bg-red-50 dark:hover:bg-red-900/10"
                    >
                      <td className="whitespace-nowrap px-6 py-4 font-medium">{item.id}</td>
                      <td className="px-6 py-4 font-mono text-xs">{item.sku}</td>
                      <td className="px-6 py-4 font-bold text-red-600 dark:text-red-400">
                        {item.quantity}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-gray-500 dark:text-gray-400">
                        {new Date(item.updated_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Stock levels are healthy.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls for Stock */}
          <PaginationControls 
            totalItems={lowStockItems.length}
            itemsPerPage={ITEMS_PER_PAGE}
            currentPage={stockPage}
            setCurrentPage={setStockPage}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;