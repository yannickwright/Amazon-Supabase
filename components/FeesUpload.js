"use client";

import { useState } from "react";
import apiClient from "@/libs/api";

export default function FeesUpload() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderId, setOrderId] = useState("");

  const getFees = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get(`/amazon/fees?orderId=${orderId}`);
      console.log("Fees Response:", response);
    } catch (err) {
      setError(err.message || "Failed to fetch fees");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Get Order Fees</h2>
        <p className="text-sm text-gray-600 mb-4">
          Enter an order ID to fetch its fees from Amazon.
        </p>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Enter Order ID"
            className="input input-bordered w-full max-w-xs"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
          />
          <button
            className="btn btn-primary"
            onClick={getFees}
            disabled={isLoading || !orderId}
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Processing...
              </>
            ) : (
              "Get Fees"
            )}
          </button>
        </div>

        {error && (
          <div className="alert alert-error mt-4">
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
