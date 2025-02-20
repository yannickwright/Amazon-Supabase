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

export async function GET(req) {
  try {
    const accessToken = await getAccessToken();

    // Get last month's shipments
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 1);

    const response = await axios.get(`${SP_API_URL}/fba/inbound/v0/shipments`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-amz-access-token": accessToken,
        "Content-Type": "application/json",
      },
      params: {
        MarketplaceId: "A1F83G8C2ARO7P",
        QueryType: "DATE_RANGE",
        LastUpdatedAfter: startDate.toISOString(),
        LastUpdatedBefore: endDate.toISOString(),
        ShipmentStatusList: [
          "WORKING",
          "SHIPPED",
          "RECEIVING",
          "CANCELLED",
          "CLOSED",
          "ERROR",
          "IN_TRANSIT",
          "DELIVERED",
          "CHECKED_IN",
        ].join(","),
        PageSize: 10,
      },
    });

    // We're returning the raw response
    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error fetching shipments:", error.response?.data || error);
    return NextResponse.json(
      { error: "Failed to fetch shipments" },
      { status: error.response?.status || 500 }
    );
  }
}
