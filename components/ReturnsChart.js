"use client";

import { useEffect, useState } from "react";
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
    x: {
      stacked: true,
      title: {
        display: true,
        text: "Month",
      },
      grid: {
        display: false,
      },
    },
    y: {
      stacked: true,
      beginAtZero: true,
      title: {
        display: true,
        text: "Quantity",
      },
      grid: {
        display: false,
      },
    },
  },
  maintainAspectRatio: false,
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

export default function ReturnsChart({ data }) {
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
            return monthData[data.chart.dispositions.indexOf(disposition)] || 0;
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
    } catch (err) {
      setError(err.message || "Failed to process data");
    } finally {
      setIsLoading(false);
    }
  }, [data]);

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

  if (!chartData) {
    return null;
  }

  return (
    <div className="card bg-white w-full max-w-[1200px] mx-auto border-2 border-base-300 rounded-2xl shadow-[0_0_15px_2px_rgba(0,0,0,0.1)]">
      <div className="card-body p-8 rounded-2xl">
        {/* Chart Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold">Returns by Month</h2>
              <p className="text-sm text-gray-600">
                Monthly breakdown of returns by disposition
              </p>
            </div>
          </div>
          <div className="w-full" style={{ height: "400px" }}>
            <Bar options={options} data={chartData} />
          </div>
        </div>
      </div>
    </div>
  );
}
