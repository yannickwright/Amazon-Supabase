"use client";

import { useState, useEffect } from "react";
import apiClient from "@/libs/api";
import ReturnsChart from "./ReturnsChart";

const AmazonReturns = () => {
  const [returnsData, setReturnsData] = useState(null);
  const [cogData, setCogData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch returns data
        const returnsResponse = await apiClient.get("/returns");
        if (returnsResponse.returns) {
          setReturnsData(returnsResponse.returns);
        }

        // Fetch COGs data
        const cogsResponse = await apiClient.get("/cogs");
        if (cogsResponse.cogs) {
          setCogData(cogsResponse.cogs);
        }
      } catch (err) {
        setError(err.message || "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>{error}</span>
      </div>
    );
  }

  if (!returnsData) {
    return (
      <div className="alert alert-info">
        <span>
          No returns data available. Please generate a report in Settings.
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ReturnsChart data={returnsData} cogData={cogData} />
    </div>
  );
};

export default AmazonReturns;
