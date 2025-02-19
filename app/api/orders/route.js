import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import clientPromise from "@/libs/mongo";

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

    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection("orders");

    // Create document with order data
    const orderDocument = {
      userEmail: user.email,
      reportId,
      dateRange,
      data,
      createdAt: new Date(),
    };

    // Save to database
    await collection.insertOne(orderDocument);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving orders:", error);
    return NextResponse.json(
      { error: "Failed to save orders" },
      { status: 500 }
    );
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

    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection("orders");

    // Get all order data for this user, sorted by date range
    const orders = await collection
      .find({ userEmail: user.email })
      .sort({ dateRange: 1 })
      .toArray();

    return NextResponse.json({ orders: orders.map((order) => order.data) });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
