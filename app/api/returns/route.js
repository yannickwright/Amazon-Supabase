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

    const { reportId, data } = await req.json();

    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection("returns");

    // Delete all existing returns data for this user
    await collection.deleteMany({ userEmail: user.email });

    // Create document with report data
    const returnDocument = {
      userEmail: user.email,
      reportId,
      data,
      createdAt: new Date(),
    };

    // Save new report to database
    await collection.insertOne(returnDocument);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving returns:", error);
    return NextResponse.json(
      { error: "Failed to save returns" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection("returns");

    // Get the most recent returns data for this user
    const returns = await collection
      .find({ userEmail: session.user.email })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();

    return NextResponse.json({ returns: returns[0]?.data || null });
  } catch (error) {
    console.error("Error fetching returns:", error);
    return NextResponse.json(
      { error: "Failed to fetch returns" },
      { status: 500 }
    );
  }
}
