"use client";

import { useState, useEffect } from "react";
import apiClient from "@/libs/api";

export default function FeePreviewUpload() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportId, setReportId] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [processedRecords, setProcessedRecords] = useState(null);

  const requestReport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setProcessedRecords(null);

      const response = await apiClient.get("/amazon/feepreviews");

      if (response.reportId) {
        setReportId(response.reportId);
        setCountdown(30); // Start the countdown
      }
    } catch (err) {
      setError(err.message || "Failed to request report");
      setIsLoading(false);
    }
  };

  // Check report status when countdown reaches 0
  useEffect(() => {
    if (!reportId || countdown > 0) return;

    const checkStatus = async () => {
      try {
        const response = await apiClient.get(
          `/amazon/feepreviews/${reportId}/status`
        );

        if (response.processingStatus === "DONE") {
          // Process the report
          const downloadResponse = await apiClient.get(
            `/amazon/feepreviews/${reportId}/download`
          );
          setProcessedRecords(downloadResponse.processedRecords);
          setIsLoading(false);
          setReportId(null);
        } else if (response.processingStatus === "FAILED") {
          throw new Error("Report processing failed");
        } else {
          // Still processing, wait another 30 seconds
          setCountdown(30);
        }
      } catch (err) {
        setError(err.message || "Failed to check report status");
        setIsLoading(false);
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

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Get Fee Preview Report</h2>
        <p className="text-sm text-gray-600 mb-4">
          Download fee previews for unshipped orders.
        </p>

        <div className="flex items-center gap-2">
          <button
            className="btn btn-primary"
            onClick={requestReport}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Processing... {countdown > 0 && `(${countdown}s)`}
              </>
            ) : (
              "Get Fee Preview"
            )}
          </button>
        </div>

        {processedRecords && (
          <div className="alert alert-success mt-4">
            <span>Successfully processed {processedRecords} records!</span>
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
