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
    const url = new URL(req.url);
    const shipmentIds = url.searchParams.get("shipmentIds")?.split(",") || [];

    // If no shipmentIds provided, use the old 6-month logic
    if (shipmentIds.length === 0) {
      // Calculate date 6 months ago
      const createdAfter = new Date();
      createdAfter.setMonth(createdAfter.getMonth() - 6);

      console.log("Requesting shipments after:", createdAfter.toISOString());

      const response = await axios.get(
        `${SP_API_URL}/fba/inbound/v0/shipments`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "x-amz-access-token": accessToken,
            "Content-Type": "application/json",
          },
          params: {
            MarketplaceId: "A1F83G8C2ARO7P",
            QueryType: "SHIPMENT",
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
            PageSize: 100,
            CreatedAfter: createdAfter.toISOString(),
          },
        }
      );

      // Log raw response data
      console.log(
        "Raw API Response - First 3 shipments:",
        JSON.stringify(response.data.payload.ShipmentData.slice(0, 3), null, 2)
      );

      if (!response.data?.payload?.ShipmentData) {
        throw new Error("Invalid response from shipments list API");
      }

      // Get items for each shipment
      const processedShipments = await Promise.all(
        response.data.payload.ShipmentData.map(async (shipment) => {
          try {
            const itemsResponse = await axios.get(
              `${SP_API_URL}/fba/inbound/v0/shipments/${shipment.ShipmentId}/items`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "x-amz-access-token": accessToken,
                  "Content-Type": "application/json",
                },
                params: {
                  MarketplaceId: "A1F83G8C2ARO7P",
                },
              }
            );

            const items = itemsResponse.data.payload.ItemData;
            const totals = items.reduce(
              (acc, item) => ({
                totalQuantityShipped:
                  acc.totalQuantityShipped +
                  (parseInt(item.QuantityShipped) || 0),
                totalQuantityReceived:
                  acc.totalQuantityReceived +
                  (parseInt(item.QuantityReceived) || 0),
                totalSKUs: acc.totalSKUs + 1,
              }),
              {
                totalQuantityShipped: 0,
                totalQuantityReceived: 0,
                totalSKUs: 0,
              }
            );

            return {
              ShipmentId: shipment.ShipmentId,
              ShipmentName: shipment.ShipmentName,
              ShipmentStatus: shipment.ShipmentStatus,
              DestinationFulfillmentCenterId:
                shipment.DestinationFulfillmentCenterId,
              createdDate:
                shipment.ShipmentCreatedDate ||
                shipment.ShipmentName?.match(/\((.*?)\)/)?.[1] ||
                null,
              ...totals,
            };
          } catch (error) {
            console.error(
              `Error fetching items for shipment ${shipment.ShipmentId}:`,
              error
            );
            return {
              ...shipment,
              totalQuantityShipped: 0,
              totalQuantityReceived: 0,
              totalSKUs: 0,
            };
          }
        })
      );

      // Log processed shipments
      console.log(
        "Processed Shipments - First 3:",
        JSON.stringify(processedShipments.slice(0, 3), null, 2)
      );

      return processedShipments;
    }

    // Get items for provided shipment IDs
    const processedShipments = [];
    const BATCH_SIZE = 10;

    // Process shipmentIds in batches of 10
    for (let i = 0; i < shipmentIds.length; i += BATCH_SIZE) {
      const batchIds = shipmentIds.slice(i, i + BATCH_SIZE);

      // Add delay between batches
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }

      const response = await axios.get(
        `${SP_API_URL}/fba/inbound/v0/shipments`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "x-amz-access-token": accessToken,
            "Content-Type": "application/json",
          },
          params: {
            MarketplaceId: "A1F83G8C2ARO7P",
            QueryType: "SHIPMENT",
            ShipmentIdList: batchIds.join(","),
            PageSize: 50,
          },
        }
      );

      if (!response.data?.payload?.ShipmentData) {
        throw new Error("Invalid response from shipments list API");
      }

      // Get items for each shipment
      for (const shipment of response.data.payload.ShipmentData) {
        try {
          // Add a small delay between item requests
          await new Promise((resolve) => setTimeout(resolve, 100));

          const itemsResponse = await axios.get(
            `${SP_API_URL}/fba/inbound/v0/shipments/${shipment.ShipmentId}/items`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "x-amz-access-token": accessToken,
                "Content-Type": "application/json",
              },
              params: {
                MarketplaceId: "A1F83G8C2ARO7P",
              },
            }
          );

          const items = itemsResponse.data.payload.ItemData;
          const totals = items.reduce(
            (acc, item) => ({
              totalQuantityShipped:
                acc.totalQuantityShipped +
                (parseInt(item.QuantityShipped) || 0),
              totalQuantityReceived:
                acc.totalQuantityReceived +
                (parseInt(item.QuantityReceived) || 0),
              totalSKUs: acc.totalSKUs + 1,
            }),
            { totalQuantityShipped: 0, totalQuantityReceived: 0, totalSKUs: 0 }
          );

          processedShipments.push({
            ShipmentId: shipment.ShipmentId,
            ShipmentName: shipment.ShipmentName,
            ShipmentStatus: shipment.ShipmentStatus,
            DestinationFulfillmentCenterId:
              shipment.DestinationFulfillmentCenterId,
            createdDate:
              shipment.ShipmentCreatedDate ||
              shipment.ShipmentName?.match(/\((.*?)\)/)?.[1] ||
              null,
            ...totals,
          });
        } catch (error) {
          console.error(
            `Error processing items for shipment ${shipment.ShipmentId}:`,
            error.response?.data || error.message
          );
          processedShipments.push({
            ShipmentId: shipment.ShipmentId,
            error: true,
            totalQuantityShipped: 0,
            totalQuantityReceived: 0,
            totalSKUs: 0,
          });
        }
      }
    }

    return NextResponse.json({
      payload: {
        payload: {
          ShipmentData: processedShipments,
        },
      },
    });
  } catch (error) {
    console.error(
      "Error with Amazon SP-API:",
      error.response?.data || error.message
    );
    return NextResponse.json(
      { error: "Failed to fetch shipments" },
      { status: error.response?.status || 500 }
    );
  }
}
