import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

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

    // First get all fee order IDs for this user
    const { data: feeOrders } = await supabase
      .from("fees")
      .select("amazon_order_id")
      .eq("user_id", user.id);

    const existingOrderIds = feeOrders?.map((fee) => fee.amazon_order_id) || [];

    // Get total count first
    const { count } = await supabase
      .from("orders")
      .select("order_id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .not(
        "order_id",
        "in",
        existingOrderIds.length > 0
          ? `(${existingOrderIds.join(",")})`
          : "(NULL)"
      );

    // Now get all orders using pagination
    let allOrders = [];
    let page = 0;
    const pageSize = 1000;

    while (page * pageSize < count) {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("order_id")
        .eq("user_id", user.id)
        .not(
          "order_id",
          "in",
          existingOrderIds.length > 0
            ? `(${existingOrderIds.join(",")})`
            : "(NULL)"
        )
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;
      if (!orders.length) break;

      allOrders = [...allOrders, ...orders];
      page++;
    }

    console.log(`Found ${allOrders.length} orders without fees`);

    return NextResponse.json({ orders: allOrders });
  } catch (error) {
    console.error("Error getting pending orders:", error);
    return NextResponse.json(
      { error: "Failed to get pending orders" },
      { status: 500 }
    );
  }
}
