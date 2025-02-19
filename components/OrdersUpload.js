"use client";

import { useState, useEffect } from "react";
import apiClient from "@/libs/api";

export default function OrdersUpload() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [reportId, setReportId] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [currentDateRange, setCurrentDateRange] = useState(null);

  // Poll for report status
  useEffect(() => {
    if (!reportId || countdown > 0) return;

    const checkStatus = async () => {
      try {
        const response = await apiClient.get(
          `/amazon/orders?reportId=${reportId}`
        );

        if (response.report?.processingStatus === "DONE") {
          // Download and save the report data
          const reportData = await apiClient.get(
            `/amazon/orders/${reportId}/download`,
            {
              headers: {
                Accept: "application/json",
              },
            }
          );

          // Save to database
          await apiClient.post("/orders", {
            reportId,
            data: reportData,
            dateRange: currentDateRange,
          });

          // If we have more date ranges to process
          if (progress.current < progress.total) {
            // Request the next report
            const nextResponse = await apiClient.get("/amazon/orders", {
              params: {
                offset: progress.current,
              },
            });
            if (nextResponse.report?.reportId) {
              setReportId(nextResponse.report.reportId);
              setCurrentDateRange(nextResponse.dateRange);
              setProgress((prev) => ({ ...prev, current: prev.current + 1 }));
            }
          } else {
            setSuccess(true);
            setIsProcessing(false);
            setReportId(null);
            setCurrentDateRange(null);
          }
        } else if (response.report?.processingStatus === "FAILED") {
          throw new Error("Report processing failed");
        } else {
          // Still processing, wait 30 seconds before next check
          setCountdown(30);
        }
      } catch (err) {
        setError(err.message || "Failed to check report status");
        setIsProcessing(false);
        setReportId(null);
      }
    };

    checkStatus();
  }, [reportId, countdown, progress.current, progress.total, currentDateRange]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const createReport = async () => {
    setIsProcessing(true);
    setError(null);
    setSuccess(false);
    setReportId(null);
    setProgress({ current: 0, total: 0 });

    try {
      // Create the first report
      const response = await apiClient.get("/amazon/orders");
      if (response.report?.reportId) {
        setReportId(response.report.reportId);
        setCurrentDateRange(response.dateRange);
        setProgress({ current: 1, total: response.totalReports });
      } else {
        throw new Error("Failed to create report");
      }
    } catch (err) {
      setError(err.message || "Failed to create report");
      setIsProcessing(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Get Order Reports</h2>
        <p className="text-sm text-gray-600 mb-4">
          Generate and save your Amazon order reports for the last 18 months.
        </p>

        <div className="flex items-center gap-2">
          <button
            className="btn btn-primary btn-sm"
            onClick={createReport}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Processing{countdown > 0 ? ` (${countdown}s)` : "..."}
                {progress.total > 0 &&
                  ` (${progress.current}/${progress.total} reports)`}
              </>
            ) : (
              "Get Orders"
            )}
          </button>
        </div>

        {currentDateRange && (
          <p className="text-sm text-gray-600 mt-2">
            Currently processing: {currentDateRange}
          </p>
        )}

        {error && (
          <div className="alert alert-error mt-4">
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success mt-4">
            <span>Order data successfully saved!</span>
          </div>
        )}
      </div>
    </div>
  );
}
