import { NextResponse } from "next/server";
import axios from "axios";
import { createClient } from "@/libs/supabase/server";

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
    const supabase = createClient();

    // Get the authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = await getAccessToken();
    const url = new URL(req.url);
    const orderId = url.searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const response = await axios.get(
      `${SP_API_URL}/finances/v0/orders/${orderId}/financialEvents`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "x-amz-access-token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    // Extract the fees we want
    const shipmentItem =
      response.data?.payload?.FinancialEvents?.ShipmentEventList?.[0]
        ?.ShipmentItemList?.[0];
    const itemFeeList = shipmentItem?.ItemFeeList || [];

    // Find specific fees
    const fbaFee =
      itemFeeList.find((fee) => fee.FeeType === "FBAPerUnitFulfillmentFee")
        ?.FeeAmount?.CurrencyAmount || 0;
    const commissionFee =
      itemFeeList.find((fee) => fee.FeeType === "Commission")?.FeeAmount
        ?.CurrencyAmount || 0;
    const digitalServicesFee =
      itemFeeList.find((fee) => fee.FeeType === "DigitalServicesFee")?.FeeAmount
        ?.CurrencyAmount || 0;

    // Prepare data for database
    const feeData = {
      user_id: user.id,
      amazon_order_id: orderId,
      fba_fee: Math.abs(fbaFee), // Store as positive number
      commission_fee: Math.abs(commissionFee), // Store as positive number
      digital_services_fee: Math.abs(digitalServicesFee), // Store as positive number
      created_at: new Date().toISOString(),
    };

    // Delete any existing fee record for this order
    const { error: deleteError } = await supabase
      .from("orderfees")
      .delete()
      .eq("user_id", user.id)
      .eq("amazon_order_id", orderId);

    if (deleteError) throw deleteError;

    // Insert the new fee record
    const { error: insertError } = await supabase
      .from("orderfees")
      .insert(feeData);

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, fees: feeData });
  } catch (error) {
    console.error(
      "Error with Amazon SP-API or database:",
      error.response?.data || error.message
    );
    return NextResponse.json(
      { error: "Failed to fetch or store financial events" },
      { status: error.response?.status || 500 }
    );
  }
}
