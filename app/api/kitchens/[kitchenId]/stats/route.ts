import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { getKitchenStats, getUserByClerkId } from "@/lib/db-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: { kitchenId: string } }
) {
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

    const kitchenId = parseInt(params.kitchenId);
    if (isNaN(kitchenId)) {
      return NextResponse.json({ error: "Invalid kitchen ID" }, { status: 400 });
    }

    const stats = await getKitchenStats(kitchenId);
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error getting kitchen stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
