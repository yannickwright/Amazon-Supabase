import { NextResponse } from "next/server";
import axios from "axios";

// Changed to EU endpoint (which includes UK)
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

export async function GET(req) {
  try {
    const accessToken = await getAccessToken();
    const reportId = req.nextUrl.searchParams.get("reportId");
    const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0");

    // If no reportId is provided, create a new report
    if (!reportId) {
      // Calculate date range for this report (30-day chunks)
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - offset * 30);
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 30);

      // Format date range for response
      const dateRange = `${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`;

      // Create a new report request
      const createReportResponse = await axios.post(
        `${SP_API_URL}/reports/2021-06-30/reports`,
        {
          reportType: "GET_FLAT_FILE_ALL_ORDERS_DATA_BY_ORDER_DATE_GENERAL",
          marketplaceIds: ["A1F83G8C2ARO7P"],
          dataStartTime: startDate.toISOString(),
          dataEndTime: endDate.toISOString(),
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "x-amz-access-token": accessToken,
            "Content-Type": "application/json",
          },
        }
      );

      // Calculate total number of reports needed (18 months = ~540 days = 18 reports)
      const totalReports = 18;

      return NextResponse.json({
        report: createReportResponse.data,
        dateRange,
        totalReports,
        message:
          "Report requested successfully. Check status to know when it's ready.",
      });
    }

    // If reportId is provided, get the status
    const reportStatusResponse = await axios.get(
      `${SP_API_URL}/reports/2021-06-30/reports/${reportId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "x-amz-access-token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    return NextResponse.json({
      report: reportStatusResponse.data,
    });
  } catch (error) {
    console.error(
      "Error with Amazon SP-API:",
      error.response?.data || error.message
    );
    return NextResponse.json(
      {
        error: "Failed to request/get orders report",
        details: error.response?.data || error.message,
      },
      { status: error.response?.status || 500 }
    );
  }
}
