"use client";

import { useState, useEffect } from "react";
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

      // Get shipments array from response and handle potential undefined
      const shipmentsData = response.shipments || [];

      // Sort shipments by createdDate in descending order (newest first)
      const sortedShipments = [...shipmentsData].sort((a, b) => {
        // Parse dates and ensure UTC to avoid timezone issues
        const dateA = new Date(a.createdDate + "Z"); // Add Z to force UTC
        const dateB = new Date(b.createdDate + "Z"); // Add Z to force UTC

        // Sort in descending order (most recent first)
        if (dateA > dateB) return -1;
        if (dateA < dateB) return 1;

        // If dates are equal, sort by ShipmentId as secondary sort
        return b.ShipmentId.localeCompare(a.ShipmentId);
      });

      setShipments(sortedShipments);
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
    <>
      <h1 className="text-2xl font-bold mb-8">Shipment Reports</h1>
      <ShipmentReport
        shipments={shipments}
        isLoading={isLoading}
        error={error}
        setError={setError}
        progress={progress}
        onGenerateReport={generateReport}
      />
    </>
  );
}
