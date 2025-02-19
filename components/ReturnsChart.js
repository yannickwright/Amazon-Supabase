"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import apiClient from "@/libs/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: "top",
    },
    title: {
      display: true,
      text: "Returns by Month",
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: "Quantity",
      },
    },
    x: {
      title: {
        display: true,
        text: "Month",
      },
      grid: {
        display: false,
      },
    },
  },
  maintainAspectRatio: false,
  onClick: (event, elements) => {}, // We'll handle this through the component
};

// Add a color and order mapping for dispositions
const dispositionConfig = {
  SELLABLE: {
    color: "rgba(34, 197, 94, 0.7)", // bright green
    order: 1,
  },
  CARRIER_DAMAGED: {
    color: "rgba(21, 128, 61, 0.7)", // darker green
    order: 2,
  },
  CUSTOMER_DAMAGED: {
    color: "rgba(239, 68, 68, 0.7)", // red
    order: 3,
  },
  DAMAGED: {
    color: "rgba(249, 115, 22, 0.7)", // orange
    order: 4,
  },
  DEFECTIVE: {
    color: "rgba(234, 179, 8, 0.7)", // yellow
    order: 5,
  },
};

export default function ReturnsChart({ data, cogData }) {
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rawTableData, setRawTableData] = useState(null);
  const [displayedTableData, setDisplayedTableData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [sortBy, setSortBy] = useState("returns");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const getSortedData = (data) => {
    return [...data].sort((a, b) => {
      if (sortBy === "returns") {
        return b.quantity - a.quantity;
      } else {
        const cogA = cogData?.[a.sku || (a.skus && a.skus[0])] || 0;
        const cogB = cogData?.[b.sku || (b.skus && b.skus[0])] || 0;
        return b.quantity * cogB - a.quantity * cogA;
      }
    });
  };

  const handleBarClick = (event, elements) => {
    if (elements.length > 0) {
      const monthLabel = chartData.labels[elements[0].index];
      setSelectedMonth(monthLabel);

      const monthDate = new Date(monthLabel);
      const monthKey = monthDate.toISOString().slice(0, 7);

      const filteredData = rawTableData
        .map((item) => {
          const monthQuantity = item.monthlyQuantities[monthKey] || 0;
          const sku = item.sku || (item.skus && item.skus[0]);
          const cog = cogData?.[sku] || 0;
          return {
            ...item,
            quantity: monthQuantity,
            cog,
            totalCogLoss: monthQuantity * cog,
          };
        })
        .filter((item) => item.quantity > 0);

      setDisplayedTableData(getSortedData(filteredData));
    }
  };

  useEffect(() => {
    if (!data) return;

    setIsLoading(true);
    try {
      // Create datasets based on whether we have COG data or not
      const datasets = data.chart.dispositions
        .map((disposition) => ({
          label: disposition,
          data: data.chart.labels.map((label) => {
            const date = new Date(label);
            const monthKey = date.toISOString().slice(0, 7);
            const monthData = data.chart.dispositionData[monthKey] || [];
            const quantity =
              monthData[data.chart.dispositions.indexOf(disposition)] || 0;

            // If we have COG data, calculate the cost
            if (cogData) {
              const monthSkuData = data.chart.skuData[monthKey] || {};
              return Object.entries(monthSkuData).reduce((sum, [sku, qty]) => {
                const cogValue = cogData[sku] || 0;
                return sum + cogValue * qty;
              }, 0);
            }

            // Otherwise return quantity
            return quantity;
          }),
          backgroundColor:
            dispositionConfig[disposition]?.color ||
            `hsla(${Math.random() * 360}, 70%, 60%, 0.5)`,
          borderColor:
            dispositionConfig[disposition]?.color ||
            `hsla(${Math.random() * 360}, 70%, 50%, 1)`,
          borderWidth: 1,
          order: dispositionConfig[disposition]?.order || 99,
        }))
        .sort((a, b) => (a.order || 99) - (b.order || 99));

      const chartDataObj = {
        labels: data.chart.labels,
        datasets: datasets,
      };

      setChartData(chartDataObj);
      setRawTableData(data.table);
      setDisplayedTableData(
        data.table.map((item) => ({
          ...item,
          quantity: item.totalQuantity,
        }))
      );
    } catch (err) {
      setError(err.message || "Failed to process data");
    } finally {
      setIsLoading(false);
    }
  }, [data, cogData]);

  useEffect(() => {
    if (rawTableData && cogData) {
      const dataWithCog = rawTableData.map((item) => {
        const sku = item.sku || (item.skus && item.skus[0]);
        const cog = cogData[sku] || 0;
        const quantity = item.quantity || item.totalQuantity || 0;
        const totalCogLoss = cog * quantity;

        return {
          ...item,
          cog,
          quantity,
          totalCogLoss,
        };
      });

      setDisplayedTableData(getSortedData(dataWithCog));
    }
  }, [rawTableData, cogData, sortBy]);

  // Update chart options
  const chartOptions = {
    ...options,
    maintainAspectRatio: false,
    responsive: true,
    scales: {
      x: {
        stacked: true,
        title: {
          display: true,
          text: "Month",
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        title: {
          display: true,
          text: cogData ? "Cost (£)" : "Quantity",
        },
      },
    },
    plugins: {
      ...options.plugins,
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    onClick: handleBarClick,
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, sortBy]);

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

  if (!chartData || !displayedTableData) {
    return null;
  }

  // Calculate pagination after we know we have data
  const totalPages = Math.ceil(displayedTableData.length / ITEMS_PER_PAGE);
  const paginatedData = displayedTableData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-8">
      <div className="card bg-white w-full max-w-[1200px] mx-auto border-2 border-base-300 rounded-2xl shadow-[0_0_15px_2px_rgba(0,0,0,0.1)]">
        <div className="card-body p-8 rounded-2xl">
          {/* Chart Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold">Returns by Month</h2>
                <p className="text-sm text-gray-600">
                  Click on a month to filter the table below
                </p>
              </div>
            </div>
            <div className="w-full" style={{ height: "400px" }}>
              <Bar options={chartOptions} data={chartData} />
            </div>
          </div>

          <div className="border-t-2 border-base-300 my-6"></div>

          {/* Table Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold">
                  Returns Breakdown{" "}
                  {selectedMonth ? `for ${selectedMonth}` : "(All Time)"}
                </h2>
                <p className="text-sm text-gray-600">
                  View your Amazon FBA returns analysis
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="select select-bordered select-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="returns">Sort by Returns</option>
                  <option value="cogLoss">Sort by COG Loss</option>
                </select>
                {selectedMonth && (
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => {
                      setSelectedMonth(null);
                      setDisplayedTableData(
                        getSortedData(
                          rawTableData.map((item) => ({
                            ...item,
                            quantity: item.totalQuantity,
                          }))
                        )
                      );
                    }}
                  >
                    Show All Time
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg shadow-xl border-2 border-base-300 bg-white">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th className="px-8">ASIN</th>
                    <th className="px-16">Product Name</th>
                    <th className="px-8 text-right">Returns</th>
                    {cogData && (
                      <>
                        <th className="px-8 text-right">COG</th>
                        <th className="px-8 text-right">Total COG Loss</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item) => {
                    const sku = item.sku || (item.skus && item.skus[0]);
                    const cog = cogData?.[sku] || 0;
                    const totalCogLoss = item.quantity * cog;

                    return (
                      <tr key={item.asin}>
                        <td className="font-mono">{item.asin}</td>
                        <td>{item.title}</td>
                        <td className="text-right">{item.quantity}</td>
                        {cogData && (
                          <>
                            <td className="text-right">
                              £{Number(cog).toFixed(2)}
                            </td>
                            <td className="text-right">
                              £{Number(totalCogLoss).toFixed(2)}
                            </td>
                          </>
                        )}
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
                    displayedTableData.length
                  )}{" "}
                  of {displayedTableData.length} returns
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
          </div>
        </div>
      </div>
    </div>
  );
}
