import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { getAllCategories, createCategory } from "@/lib/db-utils";
import { defaultCategories } from "@/lib/default-categories";

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if categories already exist
    const existingCategories = await getAllCategories();
    
    if (existingCategories.length > 0) {
      return NextResponse.json({ 
        message: "Categories already exist",
        count: existingCategories.length 
      });
    }

    // Create default categories
    const createdCategories = [];
    for (const category of defaultCategories) {
      const created = await createCategory(category);
      createdCategories.push(created);
    }

    return NextResponse.json({ 
      message: "Default categories created successfully",
      categories: createdCategories,
      count: createdCategories.length
    }, { status: 201 });
  } catch (error) {
    console.error("Error seeding categories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
