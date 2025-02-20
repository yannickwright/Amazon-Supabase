"use client";

import { useState } from "react";
import apiClient from "@/libs/api";

export default function ShipmentUpload() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const generateReport = async () => {
    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      // First part - get all shipment IDs
      const allShipmentsResponse = await apiClient.get(
        "/amazon/shipments/test",
        {
          timeout: 300000,
        }
      );

      if (!allShipmentsResponse?.payload?.ShipmentData) {
        throw new Error("Invalid response from shipments list API");
      }

      const allShipmentIds = allShipmentsResponse.payload.ShipmentData.map(
        (s) => s.ShipmentId
      );

      setProgress({
        current: 0,
        total: allShipmentIds.length,
      });

      // Process shipments in batches
      const BATCH_SIZE = 10;
      const allProcessedShipments = [];

      for (let i = 0; i < allShipmentIds.length; i += BATCH_SIZE) {
        const batchIds = allShipmentIds.slice(i, i + BATCH_SIZE);

        const response = await apiClient.get("/amazon/shipments", {
          params: {
            shipmentIds: batchIds.join(","),
          },
        });

        if (response?.payload?.payload?.ShipmentData) {
          allProcessedShipments.push(...response.payload.payload.ShipmentData);
        }

        setProgress({
          current: Math.min(i + BATCH_SIZE, allShipmentIds.length),
          total: allShipmentIds.length,
        });

        if (i + BATCH_SIZE < allShipmentIds.length) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }

      // Save to database
      await apiClient.post("/shipments", {
        shipments: allProcessedShipments,
      });

      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to generate report");
    } finally {
      setIsProcessing(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Get Shipments Report</h2>
        <p className="text-sm text-gray-600 mb-4">
          Generate and save your Amazon FBA inbound shipment data.
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
                {progress.total > 0
                  ? `Processing ${progress.current}/${progress.total}...`
                  : "Processing..."}
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
            <span>Shipment data successfully saved!</span>
          </div>
        )}
      </div>
    </div>
  );
}
