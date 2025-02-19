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

    // Delete existing returns data for this user
    const { error: deleteError } = await supabase
      .from("returns")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) throw deleteError;

    // Create new returns record
    const { error: insertError } = await supabase.from("returns").insert({
      user_id: user.id,
      report_id: reportId,
      data,
    });

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

    // Get the most recent returns data for this user
    const { data: returns, error } = await supabase
      .from("returns")
      .select("data")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // Ignore "no rows returned" error
      throw error;
    }

    return NextResponse.json({ returns: returns?.data || null });
  } catch (error) {
    console.error("Error fetching returns:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
