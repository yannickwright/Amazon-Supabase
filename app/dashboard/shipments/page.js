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
      console.log("API Response:", response);

      // Sort shipments by createdDate in descending order (newest first)
      const sortedShipments = [...response.data].sort((a, b) => {
        // Parse the full datetime string
        const dateA = new Date(
          a.createdDate.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$2-$1")
        );
        const dateB = new Date(
          b.createdDate.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$2-$1")
        );

        return dateB - dateA;
      });

      setShipments(sortedShipments || []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load existing shipments");
    }
  };

  const generateReport = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get shipments from Amazon and log them
      const response = await apiClient.get("/amazon/shipments");

      console.log("Response from Amazon:", {
        shipments: response.data.shipments?.length || 0,
        firstShipment: response.data.shipments?.[0],
        shipmentIds: response.data.shipments?.map((s) => s.ShipmentId),
      });

      setIsLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setError(error.message);
      setIsLoading(false);
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
