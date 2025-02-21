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

    if (!Array.isArray(data)) {
      return NextResponse.json(
        { error: "Invalid data format - expected an array" },
        { status: 400 }
      );
    }

    // Transform data into normalized format
    const ordersData = data.map((item) => ({
      user_id: user.id,
      sku: item.sku || "",
      asin: item.asin || "",
      order_id: item["amazon-order-id"] || "",
      order_date: new Date(item["purchase-date"] || new Date()),
      quantity_ordered: parseInt(item.quantity || 0),
      unit_price: parseFloat(item["item-price"] || 0),
      shipping_price: parseFloat(item["shipping-price"] || 0),
      shipping_tax: parseFloat(item["shipping-tax"] || 0),
      item_tax: parseFloat(item["item-tax"] || 0),
      currency: item.currency || "GBP",
      order_status: item["order-status"] || "",
      fulfillment_channel: item["fulfillment-channel"] || "",
      sales_channel: item["sales-channel"] || "",
      report_id: reportId,
    }));

    // Delete existing orders for this report
    const { error: deleteError } = await supabase
      .from("orders")
      .delete()
      .eq("user_id", user.id)
      .eq("report_id", reportId);

    if (deleteError) throw deleteError;

    // Insert new orders
    const { error: insertError } = await supabase
      .from("orders")
      .insert(ordersData);

    if (insertError) throw insertError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving orders:", error);
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

    // Get all orders data for this user with pagination
    const { count: totalCount } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    let allOrders = [];
    const pageSize = 1000;
    let page = 0;

    while (page * pageSize < totalCount) {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order("order_date", { ascending: false });

      if (error) throw error;
      if (orders?.length) allOrders = [...allOrders, ...orders];
      page++;
    }

    // Transform data to ensure proper formatting
    const transformedOrders = allOrders.map((order) => ({
      id: order.id,
      order_id: order.order_id,
      sku: order.sku,
      asin: order.asin,
      quantity_ordered: parseInt(order.quantity_ordered) || 0,
      unit_price: parseFloat(order.unit_price) || 0,
      order_status: order.order_status || "Unknown",
      created_at: order.order_date,
    }));

    return NextResponse.json({ orders: transformedOrders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
