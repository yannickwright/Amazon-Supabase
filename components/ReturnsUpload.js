"use client";

import { useState, useEffect } from "react";
import apiClient from "@/libs/api";

export default function ReturnsUpload() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [reportId, setReportId] = useState(null);
  const [countdown, setCountdown] = useState(0);

  // Poll for report status
  useEffect(() => {
    if (!reportId || countdown > 0) return;

    const checkStatus = async () => {
      try {
        const response = await apiClient.get(
          `/amazon/returns?reportId=${reportId}`
        );

        if (response.report?.processingStatus === "DONE") {
          // Download and save the report data
          const reportData = await apiClient.get(
            `/amazon/returns/${reportId}/download`,
            {
              headers: {
                Accept: "application/json",
              },
            }
          );

          // Save to database - reportData is the array directly
          await apiClient.post("/returns", {
            reportId,
            data: reportData, // Remove .data since the response is already the array
          });

          setSuccess(true);
          setIsProcessing(false);
          setReportId(null);
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
  }, [reportId, countdown]);

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

    try {
      // Create the report
      const response = await apiClient.get("/amazon/returns");
      if (response.report?.reportId) {
        setReportId(response.report.reportId);
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
        <h2 className="card-title">Get Returns Report</h2>
        <p className="text-sm text-gray-600 mb-4">
          Generate and save your Amazon returns report data.
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
            <span>Returns data successfully saved!</span>
          </div>
        )}
      </div>
    </div>
  );
}
