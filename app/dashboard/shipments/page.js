"use client";

import { useState, useEffect } from "react";
import ButtonAccount from "@/components/ButtonAccount";
import ShipmentReport from "@/components/ShipmentReport";
import apiClient from "@/libs/api";

export default function Shipments() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Load existing shipments on mount
  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const response = await apiClient.get("/shipments");
      // Access the shipments array from the document
      setShipments(response?.shipments || []);
    } catch (err) {
      setError("Failed to load existing shipments");
    }
  };

  const generateReport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setProgress({ current: 0, total: 0 });

      // First part - get all shipment IDs (unchanged)
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

      // Process shipments in batches (unchanged logic)
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

      // Refresh shipments from database
      await fetchShipments();
    } catch (err) {
      setError(err.message || "Failed to generate report");
    } finally {
      setIsLoading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return (
    <main className="min-h-screen p-8 pb-24">
      <section className="max-w-[1200px] mx-auto space-y-8">
        <ButtonAccount />
        <h1 className="text-3xl md:text-4xl font-extrabold">
          Shipment Reports
        </h1>
      </section>

      <section className="mt-8">
        <ShipmentReport
          shipments={shipments}
          isLoading={isLoading}
          error={error}
          setError={setError}
          progress={progress}
          onGenerateReport={generateReport}
        />
      </section>
    </main>
  );
}
