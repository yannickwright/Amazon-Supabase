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

    const { shipments } = await req.json();

    // Delete existing shipment data for this user
    const { error: deleteError } = await supabase
      .from("shipments")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) throw deleteError;

    // Create new shipment record
    const { error: insertError } = await supabase.from("shipments").insert({
      user_id: user.id,
      data: shipments,
    });

    if (insertError) throw insertError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving shipments:", error);
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

    // Get the latest shipment data for this user
    const { data: shipment, error } = await supabase
      .from("shipments")
      .select("data")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // Ignore "no rows returned" error
      throw error;
    }

    return NextResponse.json(shipment || { shipments: [] });
  } catch (error) {
    console.error("Error fetching shipments:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
