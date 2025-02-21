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

export async function GET(req, { params }) {
  try {
    const { reportId } = params;
    const accessToken = await getAccessToken();
    const supabase = createClient();

    // Get the authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Get the report document details with the download URL
    const reportDocumentResponse = await axios.get(
      `${SP_API_URL}/reports/2021-06-30/documents/${reportDocResponse.data.reportDocumentId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "x-amz-access-token": accessToken,
        },
      }
    );

    // Download and process the TSV file
    const reportDataResponse = await axios.get(reportDocumentResponse.data.url);
    const tsvData = reportDataResponse.data;

    // Process TSV data
    const rows = tsvData.split("\n").map((row) => row.split("\t"));
    const headers = rows[0];

    // Convert to array of objects
    const fees = rows
      .slice(1)
      .filter((row) => row.length === headers.length) // Skip malformed rows
      .map((row) => ({
        user_id: user.id,
        sku: row[headers.indexOf("sku")],
        asin: row[headers.indexOf("asin")],
        product_name: row[headers.indexOf("product-name")],
        your_price: parseFloat(row[headers.indexOf("your-price")] || 0),
        sales_price: parseFloat(row[headers.indexOf("sales-price")] || 0),
        estimated_fee_total: parseFloat(
          row[headers.indexOf("estimated-fee-total")] || 0
        ),
        estimated_referral_fee: parseFloat(
          row[headers.indexOf("estimated-referral-fee-per-unit")] || 0
        ),
        estimated_fulfillment_fee: parseFloat(
          row[headers.indexOf("expected-domestic-fulfilment-fee-per-unit")] || 0
        ),
        report_id: reportId,
      }));

    // Delete ALL previous fee entries for this user
    const { error: deleteError } = await supabase
      .from("estimatedfees")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) throw deleteError;

    // Insert new fees
    const { error: insertError } = await supabase
      .from("estimatedfees")
      .insert(fees);

    if (insertError) throw insertError;

    // Return both the download URL and the processed data
    return NextResponse.json({
      downloadUrl: reportDocumentResponse.data.url,
      processedRecords: fees.length,
    });
  } catch (error) {
    console.error("Error processing fee preview report:", error);
    return NextResponse.json(
      { error: "Failed to process fee preview report" },
      { status: 500 }
    );
  }
}
