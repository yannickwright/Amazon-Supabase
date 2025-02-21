"use client";

import { useState } from "react";
import apiClient from "@/libs/api";

export default function FeesUpload() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [remainingOrders, setRemainingOrders] = useState(0);

  const getFees = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get all orders that don't have fees yet
      const response = await apiClient.get("/amazon/fees/pending");
      const orders = response.orders || [];

      setProgress({ current: 0, total: orders.length });
      setRemainingOrders(orders.length);

      if (orders.length === 0) {
        setError("No orders found that need fees");
        setIsLoading(false);
        return;
      }

      // Process each order with a 1-second delay
      for (let i = 0; i < orders.length; i++) {
        const order = orders[i];
        try {
          await apiClient.get(`/amazon/fees?orderId=${order.order_id}`);
          setProgress((prev) => ({ ...prev, current: i + 1 }));
          setRemainingOrders(orders.length - (i + 1));

          // Wait 1 second before next request
          if (i < orders.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        } catch (orderError) {
          console.error(
            `Error processing order ${order.order_id}:`,
            orderError
          );
          // Continue with next order even if this one fails
        }
      }
    } catch (err) {
      setError(err.message || "Failed to fetch fees");
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Get Order Fees</h2>
        <p className="text-sm text-gray-600 mb-4">
          Fetch fees for all orders that don&apos;t have fees yet.
        </p>

        <div className="flex items-center gap-2">
          <button
            className="btn btn-primary"
            onClick={getFees}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Processing... {formatNumber(progress.current)}/
                {formatNumber(progress.total)}
                {remainingOrders > 0 &&
                  ` (${formatNumber(remainingOrders)} remaining)`}
              </>
            ) : (
              "Get All Fees"
            )}
          </button>
        </div>

        {progress.current > 0 && progress.current === progress.total && (
          <div className="alert alert-success mt-4">
            <span>
              Successfully processed {formatNumber(progress.total)} orders!
            </span>
          </div>
        )}

        {error && (
          <div className="alert alert-error mt-4">
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
