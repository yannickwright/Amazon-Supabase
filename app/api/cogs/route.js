import { NextResponse } from "next/server";
import clientPromise from "@/libs/mongo";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
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

    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection("cogs");

    // Convert cogs object to array of documents
    const cogsArray = Object.entries(cogs).map(([sku, cost]) => ({
      userEmail: session.user.email,
      sku,
      cost: parseFloat(cost),
      updatedAt: new Date(),
    }));

    // Delete existing COGs for this user and insert new ones
    await collection.deleteMany({ userEmail: session.user.email });
    if (cogsArray.length > 0) {
      await collection.insertMany(cogsArray);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving COGs:", error);
    return NextResponse.json({ error: "Failed to save COGs" }, { status: 500 });
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
    const collection = db.collection("cogs");

    const cogs = await collection
      .find({ userEmail: session.user.email })
      .toArray();

    // Convert to the same format as the previous COG data
    const cogMap = cogs.reduce((acc, cog) => {
      acc[cog.sku] = cog.cost;
      return acc;
    }, {});

    return NextResponse.json({ cogs: cogMap });
  } catch (error) {
    console.error("Error fetching COGs:", error);
    return NextResponse.json(
      { error: "Failed to fetch COGs" },
      { status: 500 }
    );
  }
}
