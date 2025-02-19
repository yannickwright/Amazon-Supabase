import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import connectMongo from "@/libs/mongoose";
import Shipment from "@/models/Shipment";

export async function GET(req) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();

    const latestShipment = await Shipment.findOne({
      userId: user.email,
    }).sort({ generatedAt: -1 });

    if (latestShipment?.shipments) {
      // Sort shipments by createdDate (newest first)
      latestShipment.shipments.sort((a, b) => {
        if (!a.createdDate || !b.createdDate) return 0;

        // Split datetime string into date and time parts
        const [dateA, timeA] = a.createdDate.split(" ");
        const [dateB, timeB] = b.createdDate.split(" ");

        // Split date into day, month, year
        const [dayA, monthA, yearA] = dateA.split("/");
        const [dayB, monthB, yearB] = dateB.split("/");

        // Create date objects with time if available
        const dateObjA = timeA
          ? new Date(`${yearA}-${monthA}-${dayA} ${timeA}`)
          : new Date(`${yearA}-${monthA}-${dayA}`);
        const dateObjB = timeB
          ? new Date(`${yearB}-${monthB}-${dayB} ${timeB}`)
          : new Date(`${yearB}-${monthB}-${dayB}`);

        return dateObjB - dateObjA; // Newest first
      });
    }

    return NextResponse.json(latestShipment || { shipments: [] });
  } catch (error) {
    console.error("Error fetching shipments:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipments" },
      { status: 500 }
    );
  }
}

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
    await connectMongo();

    // Delete all existing shipment data for this user
    await Shipment.deleteMany({ userId: user.email });

    const shipment = new Shipment({
      userId: user.email,
      shipments: data.shipments,
    });

    await shipment.save();

    return NextResponse.json(shipment);
  } catch (error) {
    console.error("Error saving shipments:", error);
    return NextResponse.json(
      { error: "Failed to save shipments" },
      { status: 500 }
    );
  }
}
