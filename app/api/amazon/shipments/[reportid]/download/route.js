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
        Accept: "text/plain",
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

    // Parse the TSV data
    const rows = finalData
      .toString()
      .split("\n")
      .map((row) => row.split("\t"));
    const headers = rows[0].map((header) =>
      header.trim().toLowerCase().replace(/\s+/g, "_")
    );

    // Convert to array of objects
    const shipments = rows
      .slice(1)
      .filter((row) => row.length === headers.length)
      .map((row) => {
        const shipment = {};
        row.forEach((value, index) => {
          shipment[headers[index]] = value.trim();
        });
        return shipment;
      });

    return NextResponse.json(shipments);
  } catch (error) {
    console.error("Error downloading report:", error);
    return NextResponse.json(
      { error: "Failed to download report" },
      { status: 500 }
    );
  }
}
