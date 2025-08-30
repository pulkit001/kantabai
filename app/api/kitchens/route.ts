import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { createKitchen, getUserByClerkId, createUserIfNotExists, getKitchensByUser } from "@/lib/db-utils";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from our database, create if doesn't exist
    let dbUser = await getUserByClerkId(clerkUserId);
    if (!dbUser) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    const body = await req.json();
    const { name, location, description, isDefault } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Kitchen name is required" }, { status: 400 });
    }

    const kitchen = await createKitchen({
      userId: dbUser.id,
      name: name.trim(),
      location: location?.trim() || null,
      description: description?.trim() || null,
      isDefault: isDefault || false,
    });

    return NextResponse.json(kitchen, { status: 201 });
  } catch (error) {
    console.error("Error creating kitchen:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkUserId } = auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from our database
    const dbUser = await getUserByClerkId(clerkUserId);
    if (!dbUser) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    const kitchens = await getKitchensByUser(dbUser.id);
    
    return NextResponse.json(kitchens);
  } catch (error) {
    console.error("Error getting kitchens:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
