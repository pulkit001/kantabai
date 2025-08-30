import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { getUserByClerkId, deleteItem } from "@/lib/db-utils";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const { userId: clerkUserId } = auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const itemId = parseInt(params.itemId);
    if (isNaN(itemId)) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
    }

    // Get user from our database
    const dbUser = await getUserByClerkId(clerkUserId);
    if (!dbUser) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    // Delete the item
    await deleteItem(itemId, dbUser.id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting item:", error);
    
    if (error instanceof Error && error.message === "Item not found") {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
