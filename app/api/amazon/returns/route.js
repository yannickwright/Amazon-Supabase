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

    // If no reportId is provided, create a new report
    if (!reportId) {
      const endDate = new Date().toISOString();
      const startDate = new Date(
        new Date().setMonth(new Date().getMonth() - 13)
      ).toISOString();

      // Create a new report request
      const createReportResponse = await axios.post(
        `${SP_API_URL}/reports/2021-06-30/reports`,
        {
          reportType: "GET_FBA_FULFILLMENT_CUSTOMER_RETURNS_DATA",
          marketplaceIds: ["A1F83G8C2ARO7P"],
          dataStartTime: startDate,
          dataEndTime: endDate,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "x-amz-access-token": accessToken,
            "Content-Type": "application/json",
          },
        }
      );

      return NextResponse.json({
        report: createReportResponse.data,
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
        error: "Failed to request/get returns report",
        details: error.response?.data || error.message,
      },
      { status: error.response?.status || 500 }
    );
  }
}
