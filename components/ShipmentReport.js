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

  // Define all possible shipment statuses
  const ALL_SHIPMENT_STATUSES = [
    "ALL",
    "WORKING",
    "READY_TO_SHIP",
    "IN_TRANSIT",
    "DELIVERED",
    "CHECKED_IN",
    "RECEIVING",
    "CLOSED",
    "CANCELLED",
  ];

  // Use this instead of dynamic status generation
  const statuses = ALL_SHIPMENT_STATUSES;

  // Filter shipments based on selected statuses and discrepancies
  const filteredShipments = shipments.filter((shipment) => {
    const statusMatch =
      selectedStatuses.has("ALL") ||
      selectedStatuses.has(shipment.ShipmentStatus);

    const discrepancy =
      parseInt(shipment.totalQuantityReceived) -
      parseInt(shipment.totalQuantityShipped);
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
                className="hidden absolute right-[235px] top-0 z-10 bg-transparent p-2"
              >
                <div className="flex flex-row items-center gap-2 -mt-1">
                  {statuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      className={`text-xs font-inter px-2 py-1 rounded-full whitespace-nowrap transition-colors ${
                        selectedStatuses.has(status)
                          ? "bg-[#34A853] text-white"
                          : "bg-gray-300 text-gray-600 hover:bg-gray-400"
                      }`}
                    >
                      {status === "ALL"
                        ? "Show All"
                        : status === "IN_TRANSIT"
                        ? "In Transit"
                        : status === "READY_TO_SHIP"
                        ? "Ready to Ship"
                        : status === "RECEIVING"
                        ? "Receiving"
                        : status === "CLOSED"
                        ? "Closed"
                        : status === "CANCELLED"
                        ? "Cancelled"
                        : status === "WORKING"
                        ? "Working"
                        : status === "DELIVERED"
                        ? "Delivered"
                        : status === "CHECKED_IN"
                        ? "Checked In"
                        : status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative inline-block">
              <button
                className="text-sm font-medium min-h-0 h-8 px-3 py-0 flex items-center gap-1 bg-[#1a73e8] text-white rounded-full w-[175px] justify-between cursor-pointer whitespace-nowrap"
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
                className="hidden absolute left-[175px] top-0 z-10 bg-transparent p-2"
              >
                <div className="flex flex-row items-center gap-2 -mt-1">
                  <button
                    onClick={() => setShowDiscrepancies("ALL")}
                    className={`text-xs font-inter px-2 py-1 rounded-full whitespace-nowrap transition-colors ${
                      showDiscrepancies === "ALL"
                        ? "bg-[#34A853] text-white"
                        : "bg-gray-300 text-gray-600 hover:bg-gray-400"
                    }`}
                  >
                    Show All
                  </button>
                  <button
                    onClick={() => setShowDiscrepancies("WITH_DISCREPANCIES")}
                    className={`text-xs font-inter px-2 py-1 rounded-full whitespace-nowrap transition-colors ${
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
            <div className="overflow-x-auto bg-base-100 rounded-xl shadow-xl">
              <table className="table table-zebra">
                <thead>
                  <tr className="text-base-content/70">
                    <th className="font-normal">Shipment ID</th>
                    <th className="font-normal">Created Date</th>
                    <th className="font-normal">Status</th>
                    <th className="font-normal">Destination</th>
                    <th className="font-normal">Shipped/Received</th>
                    <th className="font-normal">Discrepancies</th>
                    <th className="font-normal">View in SC</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedShipments.map((shipment) => {
                    const discrepancy =
                      parseInt(shipment.totalQuantityReceived) -
                      parseInt(shipment.totalQuantityShipped);
                    const sellerCentralUrl = `https://sellercentral.amazon.co.uk/fba/inbound-shipment/summary/${shipment.ShipmentId}/contents`;

                    return (
                      <tr key={shipment.ShipmentId}>
                        <td className="font-normal">{shipment.ShipmentId}</td>
                        <td>
                          {(() => {
                            // Extract date from shipment name which is in format "FBA STA (DD/MM/YYYY ..."
                            const dateMatch = shipment.ShipmentName.match(
                              /\((\d{2}\/\d{2}\/\d{4})/
                            );
                            if (dateMatch) {
                              // dateMatch[1] will contain the date part "DD/MM/YYYY"
                              return dateMatch[1];
                            }
                            // Fallback to empty string if no date found
                            return "";
                          })()}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              shipment.ShipmentStatus === "RECEIVING"
                                ? "bg-[#E9D5FD] text-[#9333EA]"
                                : shipment.ShipmentStatus === "CANCELLED"
                                ? "bg-[#FEE2E2] text-[#DC2626]"
                                : shipment.ShipmentStatus === "CLOSED"
                                ? "bg-[#DCFCE7] text-[#16A34A]"
                                : shipment.ShipmentStatus === "IN_TRANSIT"
                                ? "bg-[#E0F2FE] text-[#0284C7]" // Light blue
                                : shipment.ShipmentStatus === "WORKING"
                                ? "bg-[#FEF3C7] text-[#D97706]" // Light yellow
                                : shipment.ShipmentStatus === "READY_TO_SHIP"
                                ? "bg-[#F3E8FF] text-[#9333EA]" // Light purple
                                : shipment.ShipmentStatus === "DELIVERED"
                                ? "bg-[#E0E7FF] text-[#4F46E5]" // Light indigo
                                : shipment.ShipmentStatus === "CHECKED_IN"
                                ? "bg-[#DBEAFE] text-[#2563EB]" // Light blue
                                : "badge-ghost"
                            }`}
                          >
                            {shipment.ShipmentStatus}
                          </span>
                        </td>
                        <td>{shipment.DestinationFulfillmentCenterId}</td>
                        <td>{`${shipment.totalQuantityShipped}/${shipment.totalQuantityReceived}`}</td>
                        <td>
                          {shipment.ShipmentStatus !== "CLOSED" ? (
                            <span>Pending</span>
                          ) : discrepancy === 0 ? (
                            "0"
                          ) : (
                            <span
                              className={`${
                                discrepancy < 0 ? "text-[#DC2626]" : ""
                              }`}
                            >
                              {discrepancy}
                            </span>
                          )}
                        </td>
                        <td>
                          <a
                            href={sellerCentralUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost btn-xs"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-4 h-4"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
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
