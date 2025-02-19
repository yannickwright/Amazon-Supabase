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

    const data = await req.json();
    const { cogs } = data;

    // Validate the COGs data
    if (!cogs || typeof cogs !== "object") {
      return NextResponse.json(
        { error: "Invalid COGs data format" },
        { status: 400 }
      );
    }

    // Delete existing COGs for this user
    const { error: deleteError } = await supabase
      .from("cogs")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) throw deleteError;

    // Convert cogs object to array of records
    const cogsArray = Object.entries(cogs).map(([sku, cost]) => ({
      user_id: user.id,
      sku,
      cost: parseFloat(cost),
    }));

    // Insert new COGs
    const { error: insertError } = await supabase
      .from("cogs")
      .insert(cogsArray);

    if (insertError) throw insertError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving COGs:", error);
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

    // Get all COGs for this user
    const { data: cogs, error } = await supabase
      .from("cogs")
      .select("sku, cost")
      .eq("user_id", user.id);

    if (error) throw error;

    // Convert to the same format as before
    const cogMap = cogs.reduce((acc, cog) => {
      acc[cog.sku] = cog.cost;
      return acc;
    }, {});

    return NextResponse.json({ cogs: cogMap });
  } catch (error) {
    console.error("Error fetching COGs:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
