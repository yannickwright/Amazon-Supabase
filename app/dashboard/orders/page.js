"use client";

import { useState, useEffect } from "react";
import OrdersTable from "./OrdersTable";
import apiClient from "@/libs/api";

export default function Orders() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);

  // Load existing orders on mount
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await apiClient.get("/orders");
      console.log("API Response:", response);

      // Get orders array from response and handle potential undefined
      const ordersData = response.orders || [];

      // Sort orders by order date in descending order (newest first)
      const sortedOrders = [...ordersData].sort((a, b) => {
        // Parse dates and ensure UTC to avoid timezone issues
        const dateA = new Date(a.order_date + "Z"); // Changed from created_at
        const dateB = new Date(b.order_date + "Z"); // Changed from created_at

        // Sort in descending order (most recent first)
        if (dateA > dateB) return -1;
        if (dateA < dateB) return 1;

        return 0;
      });

      setOrders(sortedOrders);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-8">Orders</h1>
      {isLoading ? (
        <div className="p-8 text-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : error ? (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      ) : (
        <OrdersTable orders={orders} />
      )}
    </>
  );
}
