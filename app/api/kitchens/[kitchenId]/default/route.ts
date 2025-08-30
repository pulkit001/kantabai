import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { getUserByClerkId, setDefaultKitchen } from "@/lib/db-utils";

export async function PUT(
  req: NextRequest,
  { params }: { params: { kitchenId: string } }
) {
  try {
    const { userId: clerkUserId } = auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const kitchenId = parseInt(params.kitchenId);
    if (isNaN(kitchenId)) {
      return NextResponse.json({ error: "Invalid kitchen ID" }, { status: 400 });
    }

    // Get user from our database
    const dbUser = await getUserByClerkId(clerkUserId);
    if (!dbUser) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    // Set the kitchen as default
    const updatedKitchen = await setDefaultKitchen(kitchenId, dbUser.id);

    return NextResponse.json(updatedKitchen, { status: 200 });
  } catch (error) {
    console.error("Error setting default kitchen:", error);
    
    if (error instanceof Error && error.message === "Kitchen not found or not owned by user") {
      return NextResponse.json({ error: "Kitchen not found or access denied" }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
