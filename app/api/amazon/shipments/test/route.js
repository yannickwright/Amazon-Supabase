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
    const allShipments = [];
    let pageCount = 0;
    const MAX_PAGES = 30; // Allow up to 2.5 years of monthly windows

    // Start with a 1-month window
    let endDate = new Date();
    let startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 1);

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    do {
      pageCount++;
      if (pageCount > MAX_PAGES) {
        console.log(`Reached max pages (${MAX_PAGES}), stopping`);
        break;
      }

      console.log(`Fetching page ${pageCount}...`);
      console.log(
        `Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`
      );

      const params = {
        MarketplaceId: "A1F83G8C2ARO7P",
        QueryType: "DATE_RANGE",
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
        PageSize: 50,
        LastUpdatedAfter: startDate.toISOString(),
        LastUpdatedBefore: endDate.toISOString(),
      };

      console.log("Using params:", params);

      const response = await axios.get(
        `${SP_API_URL}/fba/inbound/v0/shipments`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "x-amz-access-token": accessToken,
            "Content-Type": "application/json",
          },
          params,
        }
      );

      if (!response.data?.payload?.ShipmentData) {
        throw new Error("Invalid response from API");
      }

      const newShipments = response.data.payload.ShipmentData;

      // Only add shipments we haven't seen before
      const uniqueNewShipments = newShipments.filter(
        (newShip) =>
          !allShipments.some(
            (existingShip) => existingShip.ShipmentId === newShip.ShipmentId
          )
      );

      allShipments.push(...uniqueNewShipments);

      console.log("Response structure:", {
        dataLength: newShipments.length,
        uniqueAdded: uniqueNewShipments.length,
        firstShipmentId: newShipments[0]?.ShipmentId,
        lastShipmentId: newShipments[newShipments.length - 1]?.ShipmentId,
      });

      // Move the date window back by 1 month
      endDate = new Date(startDate);
      startDate.setMonth(startDate.getMonth() - 1);

      if (uniqueNewShipments.length > 0) {
        console.log("Waiting 10 seconds before next request...");
        await sleep(10000);
      } else {
        console.log("No new shipments found, stopping");
        break;
      }
    } while (allShipments.length < 500);

    console.log(`Completed fetching ${allShipments.length} shipments`);
    return NextResponse.json({
      payload: {
        ShipmentData: allShipments,
        totalShipments: allShipments.length,
        pagesProcessed: pageCount,
      },
    });
  } catch (error) {
    console.error(
      "Error with Amazon SP-API:",
      error.response?.data || error.message
    );
    return NextResponse.json(
      { error: "Failed to test shipments" },
      { status: error.response?.status || 500 }
    );
  }
}

// Helper function to increment the last part of the shipment ID
function incrementShipmentId(id) {
  const prefix = id.slice(0, -3);
  const suffix = id.slice(-3);
  const nextSuffix = (parseInt(suffix, 36) + 1)
    .toString(36)
    .toUpperCase()
    .padStart(3, "0");
  return prefix + nextSuffix;
}
