import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { createItem, getUserByClerkId } from "@/lib/db-utils";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from our database
    const dbUser = await getUserByClerkId(clerkUserId);
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { 
      kitchenId, 
      name, 
      brand, 
      quantity, 
      unit, 
      categoryId, 
      location, 
      purchaseDate, 
      expiryDate, 
      notes, 
      barcode 
    } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Ingredient name is required" }, { status: 400 });
    }

    if (!kitchenId || typeof kitchenId !== 'number') {
      return NextResponse.json({ error: "Valid kitchen ID is required" }, { status: 400 });
    }

    if (quantity === undefined || quantity < 0) {
      return NextResponse.json({ error: "Valid quantity is required" }, { status: 400 });
    }

    // Determine status based on expiry date
    let status = "Fresh";
    if (expiryDate) {
      const expiry = new Date(expiryDate);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry < 0) {
        status = "Expired";
      } else if (daysUntilExpiry <= 7) {
        status = "Expiring";
      }
    }

    const ingredient = await createItem({
      kitchenId,
      name: name.trim(),
      brand: brand?.trim() || null,
      quantity,
      unit: unit?.trim() || null,
      categoryId: categoryId || null,
      location: location?.trim() || null,
      purchaseDate: purchaseDate || null,
      expiryDate: expiryDate || null,
      notes: notes?.trim() || null,
      barcode: barcode?.trim() || null,
      status: status as "Fresh" | "Expiring" | "Expired"
    });

    return NextResponse.json(ingredient, { status: 201 });
  } catch (error) {
    console.error("Error creating ingredient:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
