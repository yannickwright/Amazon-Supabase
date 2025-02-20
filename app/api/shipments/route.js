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

    // Validate shipments data
    if (!Array.isArray(shipments)) {
      return NextResponse.json(
        { error: "Invalid data format - expected an array" },
        { status: 400 }
      );
    }

    // Delete existing shipments for this user
    const { error: deleteError } = await supabase
      .from("shipments")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) throw deleteError;

    // Transform shipments into normalized format
    const shipmentsData = shipments.map((shipment) => {
      // Parse date, fallback to current date if invalid
      let createdDate;
      try {
        createdDate = new Date(shipment.createdDate || shipment.CreatedDate);
        // Check if date is valid
        if (isNaN(createdDate.getTime())) {
          createdDate = new Date();
        }
      } catch (e) {
        createdDate = new Date();
      }

      return {
        user_id: user.id,
        shipment_id: shipment.ShipmentId || "",
        shipment_name: shipment.ShipmentName || "",
        shipment_status: shipment.ShipmentStatus || "",
        destination_fulfillment_center_id:
          shipment.DestinationFulfillmentCenterId || "",
        created_date: createdDate.toISOString(),
        total_quantity_shipped: parseInt(shipment.totalQuantityShipped || 0),
        total_quantity_received: parseInt(shipment.totalQuantityReceived || 0),
        total_skus: parseInt(shipment.totalSKUs || 0),
      };
    });

    // Insert shipments
    const { error: insertError } = await supabase
      .from("shipments")
      .insert(shipmentsData);

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

    // Get all shipments for this user
    const { data: shipments, error } = await supabase
      .from("shipments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_date", { ascending: false });

    if (error) throw error;

    // Transform data for frontend consistency
    const transformedShipments = (shipments || []).map((shipment) => ({
      ShipmentId: shipment.shipment_id,
      ShipmentName: shipment.shipment_name,
      ShipmentStatus: shipment.shipment_status,
      DestinationFulfillmentCenterId:
        shipment.destination_fulfillment_center_id,
      createdDate: shipment.created_date,
      totalQuantityShipped: shipment.total_quantity_shipped,
      totalQuantityReceived: shipment.total_quantity_received,
      totalSKUs: shipment.total_skus,
    }));

    return NextResponse.json({ shipments: transformedShipments });
  } catch (error) {
    console.error("Error fetching shipments:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
