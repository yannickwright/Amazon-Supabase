import { NextResponse } from "next/server";
import axios from "axios";
import { parse } from "csv-parse/sync";

const SP_API_URL = "https://sellingpartnerapi-eu.amazon.com";

async function getAccessToken() {
  try {
    const response = await axios.post(
      "https://api.amazon.com/auth/o2/token",
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: process.env.AMAZON_REFRESH_TOKEN,
        client_id: process.env.AMAZON_CLIENT_ID,
        client_secret: process.env.AMAZON_CLIENT_SECRET,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error("Error getting access token:", error);
    throw error;
  }
}

function convertTabToCSV(tabData) {
  // Split the data into rows
  const rows = tabData.toString().split("\n");

  // Process each row
  const csvRows = rows.map((row) => {
    // Split row by tabs
    const columns = row.split("\t");

    // Process each column to handle special characters and wrap in quotes if needed
    const processedColumns = columns.map((col) => {
      // Remove any double quotes already in the text
      const cleaned = col.replace(/"/g, '""');
      // Wrap in quotes if the column contains commas, quotes, or newlines
      return /[,"\n\r]/.test(cleaned) ? `"${cleaned}"` : cleaned;
    });

    // Join columns with commas
    return processedColumns.join(",");
  });

  // Join rows with newlines
  return csvRows.join("\n");
}

export async function GET(req, { params }) {
  try {
    const { reportId } = params;
    const accessToken = await getAccessToken();

    // First get the report document info
    const reportResponse = await axios.get(
      `${SP_API_URL}/reports/2021-06-30/reports/${reportId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "x-amz-access-token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    if (!reportResponse.data.reportDocumentId) {
      throw new Error("Report document ID not found");
    }

    // Get the report document details
    const documentResponse = await axios.get(
      `${SP_API_URL}/reports/2021-06-30/documents/${reportResponse.data.reportDocumentId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "x-amz-access-token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    // Download the actual report data
    const reportData = await axios.get(documentResponse.data.url, {
      responseType: "arraybuffer",
      headers: {
        Accept: "text/plain", // Changed to accept plain text (tab-delimited)
        ...(documentResponse.data.compressionAlgorithm
          ? {
              "Accept-Encoding": documentResponse.data.compressionAlgorithm,
            }
          : {}),
      },
    });

    // If the response is compressed, we need to decompress it
    let finalData = reportData.data;
    if (documentResponse.data.compressionAlgorithm === "GZIP") {
      const zlib = require("zlib");
      finalData = zlib.gunzipSync(reportData.data);
    }

    // Convert tab-delimited data to CSV
    const csvData = convertTabToCSV(finalData);

    // Parse the CSV data for both chart and table
    const rows = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
    });

    // Group by date for chart
    const chartData = rows.reduce((acc, row) => {
      const date = row["return-date"] || row["Return Date"];
      const quantity = parseInt(row["quantity"] || row["Quantity"] || 0);
      const sku = row["sku"] || row["SKU"];
      const disposition =
        row["detailed-disposition"] || row["Detailed Disposition"] || "Unknown";

      if (date) {
        const monthYear = new Date(date).toISOString().slice(0, 7);

        if (!acc[monthYear]) {
          acc[monthYear] = {
            quantity: 0,
            skuQuantities: {},
            dispositions: {},
          };
        }

        acc[monthYear].quantity += quantity;

        acc[monthYear].skuQuantities[sku] =
          (acc[monthYear].skuQuantities[sku] || 0) + quantity;

        acc[monthYear].dispositions[disposition] =
          (acc[monthYear].dispositions[disposition] || 0) + quantity;
      }
      return acc;
    }, {});

    // Group by ASIN for table
    const asinData = rows.reduce((acc, row) => {
      const asin = row["asin"] || row["ASIN"];
      const sku = row["sku"] || row["SKU"];
      const date = row["return-date"] || row["Return Date"];
      const quantity = parseInt(row["quantity"] || row["Quantity"] || 0);
      const title =
        row["product-name"] || row["Product Name"] || "Unknown Product";

      if (asin && date) {
        const monthYear = new Date(date).toISOString().slice(0, 7);

        if (!acc[asin]) {
          acc[asin] = {
            asin,
            sku, // Store primary SKU directly
            skus: [sku], // Store array of SKUs instead of Set
            title,
            totalQuantity: 0,
            monthlyQuantities: {},
          };
        } else if (!acc[asin].skus.includes(sku)) {
          acc[asin].skus.push(sku); // Add new SKU if not already present
        }

        acc[asin].totalQuantity += quantity;
        acc[asin].monthlyQuantities[monthYear] =
          (acc[asin].monthlyQuantities[monthYear] || 0) + quantity;
      }
      return acc;
    }, {});

    // Sort ASIN data by total quantity
    const sortedAsinData = Object.values(asinData).sort(
      (a, b) => b.totalQuantity - a.totalQuantity
    );

    // Sort chart data chronologically
    const sortedChartData = Object.entries(chartData)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .reduce((obj, [key, value]) => {
        const date = new Date(key + "-01");
        const label = date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
        obj[label] = value;
        return obj;
      }, {});

    // If it's an API request for visualization data
    if (req.headers.get("Accept") === "application/json") {
      // Get unique dispositions across all months
      const allDispositions = [
        ...new Set(
          Object.values(chartData).flatMap((data) =>
            Object.keys(data.dispositions)
          )
        ),
      ].sort();

      return NextResponse.json({
        chart: {
          labels: Object.keys(sortedChartData),
          values: Object.values(sortedChartData).map((v) => v.quantity), // Keep for backward compatibility
          dispositions: allDispositions,
          dispositionData: Object.entries(chartData).reduce(
            (acc, [month, data]) => {
              acc[month] = allDispositions.map(
                (disposition) => data.dispositions[disposition] || 0
              );
              return acc;
            },
            {}
          ),
          skuData: Object.entries(chartData).reduce((acc, [month, data]) => {
            acc[month] = data.skuQuantities;
            return acc;
          }, {}),
        },
        table: sortedAsinData,
      });
    }

    // Otherwise return CSV download as before
    return new NextResponse(csvData, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=returns-${reportId}.csv`,
      },
    });
  } catch (error) {
    console.error("Error downloading report:", error);
    return NextResponse.json(
      {
        error: "Failed to download report",
        details: error.response?.data || error.message,
      },
      { status: error.response?.status || 500 }
    );
  }
}
