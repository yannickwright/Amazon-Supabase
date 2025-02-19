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

    const { reportId, data, dateRange } = await req.json();

    // Create new order record
    const { error: insertError } = await supabase.from("orders").insert({
      user_id: user.id,
      report_id: reportId,
      date_range: dateRange,
      data,
    });

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

    // Get all order data for this user, sorted by date range
    const { data: orders, error } = await supabase
      .from("orders")
      .select("data")
      .eq("user_id", user.id)
      .order("date_range", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ orders: orders.map((order) => order.data) });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
