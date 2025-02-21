"use client";

import { useState, useEffect } from "react";
import ReturnsTable from "./ReturnsTable";
import ReturnsChart from "@/components/ReturnsChart";
import apiClient from "@/libs/api";

export default function Returns() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [returns, setReturns] = useState([]);
  const [chartData, setChartData] = useState(null);

  // Load existing returns on mount
  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      const response = await apiClient.get("/returns");
      console.log("API Response:", response);

      // Get returns array from response and handle potential undefined
      const returnsData = response.returns || [];

      // Sort returns by return date in descending order (newest first)
      const sortedReturns = [...returnsData].sort((a, b) => {
        const dateA = new Date(a.return_date + "Z");
        const dateB = new Date(b.return_date + "Z");

        if (dateA > dateB) return -1;
        if (dateA < dateB) return 1;
        return 0;
      });

      setReturns(sortedReturns);

      // Process data for the chart
      const processedData = processReturnsForChart(sortedReturns);
      setChartData(processedData);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load returns");
    } finally {
      setIsLoading(false);
    }
  };

  const processReturnsForChart = (returns) => {
    // Group returns by month and disposition
    const monthlyData = returns.reduce((acc, item) => {
      const monthKey = new Date(item.return_date).toISOString().slice(0, 7);
      if (!acc[monthKey]) {
        acc[monthKey] = {
          dispositions: {},
          skuData: {},
        };
      }

      const disposition = item.detailed_disposition || "Unknown";
      acc[monthKey].dispositions[disposition] =
        (acc[monthKey].dispositions[disposition] || 0) + item.quantity_returned;

      if (!acc[monthKey].skuData[item.sku]) {
        acc[monthKey].skuData[item.sku] = 0;
      }
      acc[monthKey].skuData[item.sku] += item.quantity_returned;

      return acc;
    }, {});

    // Get unique dispositions and sort months
    const allDispositions = [
      ...new Set(returns.map((r) => r.detailed_disposition || "Unknown")),
    ];
    const sortedMonths = Object.keys(monthlyData).sort();

    // Format data for the chart
    return {
      chart: {
        labels: sortedMonths.map((m) =>
          new Date(m).toLocaleDateString("en-GB", {
            month: "short",
            year: "numeric",
          })
        ),
        dispositions: allDispositions,
        dispositionData: sortedMonths.reduce((acc, month) => {
          acc[month] = allDispositions.map(
            (d) => monthlyData[month].dispositions[d] || 0
          );
          return acc;
        }, {}),
        skuData: sortedMonths.reduce((acc, month) => {
          acc[month] = monthlyData[month].skuData;
          return acc;
        }, {}),
      },
      table: returns.reduce((acc, item) => {
        const existingItem = acc.find((i) => i.asin === item.asin);
        if (existingItem) {
          existingItem.totalQuantity += item.quantity_returned;
          if (
            !existingItem.monthlyQuantities[
              new Date(item.return_date).toISOString().slice(0, 7)
            ]
          ) {
            existingItem.monthlyQuantities[
              new Date(item.return_date).toISOString().slice(0, 7)
            ] = 0;
          }
          existingItem.monthlyQuantities[
            new Date(item.return_date).toISOString().slice(0, 7)
          ] += item.quantity_returned;
        } else {
          acc.push({
            asin: item.asin,
            sku: item.sku,
            title: item.title || "Unknown Product",
            totalQuantity: item.quantity_returned,
            monthlyQuantities: {
              [new Date(item.return_date).toISOString().slice(0, 7)]:
                item.quantity_returned,
            },
          });
        }
        return acc;
      }, []),
    };
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-8">Returns</h1>
      {isLoading ? (
        <div className="p-8 text-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : error ? (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <ReturnsChart data={chartData} />
          </div>
          <ReturnsTable returns={returns} />
        </>
      )}
    </>
  );
}
