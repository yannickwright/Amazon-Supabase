import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

export async function POST(req) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reportId, data } = await req.json();

    // Check if data is an array
    if (!Array.isArray(data)) {
      return NextResponse.json(
        { error: "Invalid data format - expected an array" },
        { status: 400 }
      );
    }

    // Transform data into normalized format
    const returnsData = data.map((item) => ({
      user_id: user.id,
      sku: item.sku || item.SKU,
      asin: item.asin || item.ASIN,
      order_id: item["order-id"] || item["Order ID"],
      order_date: new Date(
        item["order-date"] || item["Order Date"] || new Date()
      ),
      return_date: new Date(item["return-date"] || item["Return Date"]),
      quantity_returned: parseInt(item.quantity || item.Quantity || 0),
      refund_amount: parseFloat(
        item["refund-amount"] || item["Refund Amount"] || 0
      ),
      reason_code: item.reason || item.Reason || "",
      detailed_disposition:
        item["detailed-disposition"] || item["Detailed Disposition"] || "",
      status: item.status || item.Status || "",
      return_type: item["return-type"] || item["Return Type"] || "",
      return_condition:
        item["return-condition"] || item["Return Condition"] || "",
      resolution: item.resolution || item.Resolution || "",
      report_id: reportId,
    }));

    // Delete existing returns for this report
    const { error: deleteError } = await supabase
      .from("returns")
      .delete()
      .eq("user_id", user.id)
      .eq("report_id", reportId);

    if (deleteError) throw deleteError;

    // Insert new returns
    const { error: insertError } = await supabase
      .from("returns")
      .insert(returnsData);

    if (insertError) throw insertError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving returns:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all returns data for this user with pagination
    const { count: totalCount } = await supabase
      .from("returns")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    let allReturns = [];
    const pageSize = 1000;
    let page = 0;

    while (page * pageSize < totalCount) {
      const { data: returns, error } = await supabase
        .from("returns")
        .select("*")
        .eq("user_id", user.id)
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order("return_date", { ascending: false });

      if (error) throw error;
      if (returns?.length) allReturns = [...allReturns, ...returns];
      page++;
    }

    // Transform data to ensure proper formatting
    const transformedReturns = allReturns.map((returnItem) => ({
      id: returnItem.id,
      order_id: returnItem.order_id,
      sku: returnItem.sku,
      asin: returnItem.asin,
      quantity_returned: parseInt(returnItem.quantity_returned) || 0,
      refund_amount: parseFloat(returnItem.refund_amount) || 0,
      return_date: returnItem.return_date,
      status: returnItem.status || "Unknown",
      detailed_disposition: returnItem.detailed_disposition || "Unknown",
    }));

    return NextResponse.json({ returns: transformedReturns });
  } catch (error) {
    console.error("Error fetching returns:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
