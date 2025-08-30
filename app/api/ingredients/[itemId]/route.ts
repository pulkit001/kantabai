import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { getUserByClerkId, deleteItem, updateItemQuantity, updateItem } from "@/lib/db-utils";

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

export async function PUT(
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

    const body = await req.json();
    const { action, quantity, itemData } = body;

    if (action === "updateQuantity") {
      if (typeof quantity !== "number" || quantity < 0) {
        return NextResponse.json({ error: "Valid quantity is required" }, { status: 400 });
      }

      const updatedItem = await updateItemQuantity(itemId, quantity, dbUser.id);
      
      if (!updatedItem) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }

      return NextResponse.json(updatedItem, { status: 200 });
    }

    if (action === "markAsConsumed") {
      // Mark as consumed by setting quantity to 0
      const updatedItem = await updateItemQuantity(itemId, 0, dbUser.id);
      
      if (!updatedItem) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }

      return NextResponse.json(updatedItem, { status: 200 });
    }

    if (action === "updateItem") {
      if (!itemData || typeof itemData !== "object") {
        return NextResponse.json({ error: "Item data is required" }, { status: 400 });
      }

      const updatedItem = await updateItem(itemId, itemData, dbUser.id);
      
      if (!updatedItem) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }

      return NextResponse.json(updatedItem, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Error updating item:", error);
    
    if (error instanceof Error && error.message === "Item not found") {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
