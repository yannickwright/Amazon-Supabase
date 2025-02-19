import { NextResponse } from "next/server";
import axios from "axios";

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

    // Get the report document URL
    const reportDocResponse = await axios.get(
      `${SP_API_URL}/reports/2021-06-30/reports/${reportId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "x-amz-access-token": accessToken,
        },
      }
    );

    if (!reportDocResponse.data.reportDocumentId) {
      throw new Error("No report document ID found");
    }

    // Get the report document
    const reportDocumentResponse = await axios.get(
      `${SP_API_URL}/reports/2021-06-30/documents/${reportDocResponse.data.reportDocumentId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "x-amz-access-token": accessToken,
        },
      }
    );

    // Download the report
    const reportDataResponse = await axios.get(reportDocumentResponse.data.url);
    const tsvData = reportDataResponse.data;

    // Process TSV data
    const rows = tsvData.split("\n").map((row) => row.split("\t"));
    const headers = rows[0].map((header) =>
      header.trim().toLowerCase().replace(/\s+/g, "_")
    );

    // Convert to array of objects
    const orders = rows
      .slice(1)
      .filter((row) => row.length === headers.length) // Skip malformed rows
      .map((row) => {
        const order = {};
        row.forEach((value, index) => {
          order[headers[index]] = value.trim();
        });
        return order;
      });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error downloading report:", error);
    return NextResponse.json(
      { error: "Failed to download report" },
      { status: 500 }
    );
  }
}
