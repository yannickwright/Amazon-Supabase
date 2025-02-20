"use client";

import { useState, useEffect } from "react";
import apiClient from "@/libs/api";

export default function ShipmentReport({
  shipments,
  isLoading,
  error,
  setError,
  progress,
  onGenerateReport,
}) {
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState(new Set(["ALL"]));
  const [showDiscrepancies, setShowDiscrepancies] = useState("ALL"); // "ALL", "WITH_DISCREPANCIES"
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  // Get unique statuses from shipments
  const statuses = [
    "ALL",
    ...new Set(shipments.map((s) => s.ShipmentStatus)),
  ].sort();

  // Filter shipments based on selected statuses and discrepancies
  const filteredShipments = shipments.filter((shipment) => {
    const statusMatch =
      selectedStatuses.has("ALL") ||
      selectedStatuses.has(shipment.ShipmentStatus);

    const discrepancy =
      shipment.totalQuantityReceived - shipment.totalQuantityShipped;
    const discrepancyMatch =
      showDiscrepancies === "ALL" ||
      (showDiscrepancies === "WITH_DISCREPANCIES" &&
        shipment.ShipmentStatus === "CLOSED" &&
        discrepancy !== 0);

    return statusMatch && discrepancyMatch;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredShipments.length / ITEMS_PER_PAGE);
  const paginatedShipments = filteredShipments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleStatusChange = (status) => {
    const newSelectedStatuses = new Set(selectedStatuses);

    if (status === "ALL") {
      // If "ALL" is being toggled, either select only "ALL" or clear all
      if (newSelectedStatuses.has("ALL")) {
        newSelectedStatuses.clear();
      } else {
        newSelectedStatuses.clear();
        newSelectedStatuses.add("ALL");
      }
    } else {
      // If a specific status is being toggled
      if (newSelectedStatuses.has("ALL")) {
        newSelectedStatuses.clear();
      }
      if (newSelectedStatuses.has(status)) {
        newSelectedStatuses.delete(status);
      } else {
        newSelectedStatuses.add(status);
      }
    }

    // If nothing is selected, default to "ALL"
    if (newSelectedStatuses.size === 0) {
      newSelectedStatuses.add("ALL");
    }

    setSelectedStatuses(newSelectedStatuses);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Add useEffect to reset page when discrepancy filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [showDiscrepancies]);

  return (
    <div className="space-y-8">
      <div className="card bg-white w-full max-w-[1200px] mx-auto border-2 border-base-300 rounded-2xl shadow-[0_0_15px_2px_rgba(0,0,0,0.1)]">
        <div className="card-body p-8 rounded-2xl">
          <div>
            <h2 className="text-xl font-bold">FBA Inbound Shipments</h2>
            <p className="text-sm text-gray-600">
              View your Amazon FBA inbound shipment status
            </p>
          </div>

          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          {isLoading && progress.total > 0 && (
            <div className="w-full">
              <progress
                className="progress progress-primary w-full"
                value={progress.current}
                max={progress.total}
              ></progress>
              <p className="text-sm text-center mt-2">
                Processing {progress.current} of {progress.total} shipments...
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <div className="relative inline-block">
              <button
                className="text-sm font-medium min-h-0 h-8 px-3 py-0 flex items-center gap-1 bg-[#1a73e8] text-white rounded-full w-[175px] justify-between cursor-pointer"
                onClick={() =>
                  document
                    .getElementById("status-filter")
                    .classList.toggle("hidden")
                }
              >
                Filter Status
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              <div
                id="status-filter"
                className="hidden absolute right-[400px] top-1 z-10"
              >
                <div className="flex flex-row items-center gap-6">
                  {statuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      className={`text-sm font-inter px-3 py-1 rounded-full transition-colors ${
                        selectedStatuses.has(status)
                          ? "bg-[#34A853] text-white"
                          : "bg-gray-300 text-gray-600 hover:bg-gray-400"
                      }`}
                    >
                      {status === "ALL"
                        ? "All Statuses"
                        : status === "IN_TRANSIT"
                        ? "In Transit"
                        : status === "RECEIVING"
                        ? "Receiving"
                        : status === "CLOSED"
                        ? "Closed"
                        : status === "CANCELLED"
                        ? "Cancelled"
                        : status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative inline-block">
              <button
                className="text-sm font-medium min-h-0 h-8 px-3 py-0 flex items-center gap-1 bg-[#1a73e8] text-white rounded-full w-fit cursor-pointer"
                onClick={() =>
                  document
                    .getElementById("discrepancy-filter")
                    .classList.toggle("hidden")
                }
              >
                Filter Discrepancies
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              <div
                id="discrepancy-filter"
                className="hidden absolute left-[185px] top-1 z-10"
              >
                <div className="flex flex-row items-center gap-6">
                  <button
                    onClick={() => setShowDiscrepancies("ALL")}
                    className={`text-sm font-inter px-3 py-1 rounded-full transition-colors ${
                      showDiscrepancies === "ALL"
                        ? "bg-[#34A853] text-white"
                        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    }`}
                  >
                    Show All
                  </button>
                  <button
                    onClick={() => setShowDiscrepancies("WITH_DISCREPANCIES")}
                    className={`text-sm font-inter px-3 py-1 rounded-full transition-colors ${
                      showDiscrepancies === "WITH_DISCREPANCIES"
                        ? "bg-[#34A853] text-white"
                        : "bg-gray-300 text-gray-600 hover:bg-gray-400"
                    }`}
                  >
                    Only With Discrepancies
                  </button>
                </div>
              </div>
            </div>
          </div>

          {filteredShipments.length > 0 && (
            <div className="overflow-x-auto rounded-lg shadow-xl border-2 border-base-300 bg-white">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th className="px-8">Shipment ID</th>
                    <th className="px-16">Created Date</th>
                    <th className="px-8">Status</th>
                    <th className="px-8">Destination</th>
                    <th className="px-8">Shipped/Received</th>
                    <th className="px-8">Discrepancies</th>
                    <th className="px-8">View in SC</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedShipments.map((shipment) => {
                    const discrepancy =
                      shipment.totalQuantityReceived -
                      shipment.totalQuantityShipped;
                    const sellerCentralUrl = `https://sellercentral.amazon.co.uk/fba/inbound-shipment/summary/${shipment.ShipmentId}/contents`;

                    return (
                      <tr key={shipment.ShipmentId}>
                        <td className="font-mono">{shipment.ShipmentId}</td>
                        <td>{shipment.createdDate?.split(" ")[0]}</td>
                        <td>
                          <span
                            className={`badge ${getStatusBadgeColor(
                              shipment.ShipmentStatus
                            )}`}
                          >
                            {shipment.ShipmentStatus}
                          </span>
                        </td>
                        <td>{shipment.DestinationFulfillmentCenterId}</td>
                        <td>
                          {shipment.totalQuantityShipped}/
                          {shipment.totalQuantityReceived}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              discrepancy < 0 &&
                              shipment.ShipmentStatus === "CLOSED"
                                ? "badge-error"
                                : "badge-ghost"
                            }`}
                          >
                            {shipment.ShipmentStatus === "CLOSED"
                              ? discrepancy
                              : "Pending"}
                          </span>
                        </td>
                        <td>
                          <a
                            href={sellerCentralUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost btn-sm"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="w-5 h-5"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z"
                                clipRule="evenodd"
                              />
                              <path
                                fillRule="evenodd"
                                d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="flex justify-between items-center mt-4 px-4 py-2 bg-white border-t-2 border-base-300">
                <span className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                  {Math.min(
                    currentPage * ITEMS_PER_PAGE,
                    filteredShipments.length
                  )}{" "}
                  of {filteredShipments.length} shipments
                </span>
                <div className="join">
                  <button
                    className="join-item btn btn-sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <button
                    className="join-item btn btn-sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getStatusBadgeColor(status) {
  switch (status?.toUpperCase()) {
    case "WORKING":
      return "badge-warning";
    case "SHIPPED":
      return "badge-info";
    case "RECEIVING":
      return "badge-primary";
    case "CLOSED":
      return "badge-success";
    case "CANCELLED":
      return "badge-error";
    case "ERROR":
      return "badge-error";
    case "IN_TRANSIT":
      return "badge-info";
    case "DELIVERED":
      return "badge-success";
    case "CHECKED_IN":
      return "badge-primary";
    default:
      return "badge-ghost";
  }
}
