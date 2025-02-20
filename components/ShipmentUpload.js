"use client";

import { useState } from "react";
import apiClient from "@/libs/api";

export default function ShipmentUpload() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const generateReport = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setSuccess(false);

      // First get all shipment IDs
      const response = await apiClient.get("/amazon/shipments");
      console.log("Raw Amazon response:", response.data);

      setSuccess(true);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message || "Failed to generate report");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Get Shipments Report</h2>
        <p className="text-sm text-gray-600 mb-4">
          Get your Amazon FBA inbound shipment data.
        </p>

        <div className="flex items-center gap-2">
          <button
            className="btn btn-primary btn-sm"
            onClick={generateReport}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Processing...
              </>
            ) : (
              "Get Report"
            )}
          </button>
        </div>

        {error && (
          <div className="alert alert-error mt-4">
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success mt-4">
            <span>Shipment data retrieved!</span>
          </div>
        )}
      </div>
    </div>
  );
}
