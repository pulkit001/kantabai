import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { getUserByClerkId, createItem, getAllCategories } from "@/lib/db-utils";
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Function to extract ingredients from PDF using Gemini Vision
async function extractIngredientsFromPDF(pdfBuffer: Buffer) {
  try {
    console.log('🤖 Using Gemini Vision to analyze PDF directly...');
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
You are an expert at analyzing grocery invoices and extracting ingredient information.

Please analyze this grocery invoice PDF and extract ALL food/grocery items in a structured JSON format that matches our database schema.

Return a JSON array of ingredients with this EXACT structure:
{
  "name": "Clean item name (required, max 150 chars)",
  "brand": "Brand name if mentioned (max 100 chars, or null)",
  "quantity": number (integer, default 1),
  "unit": "Standard unit (max 50 chars: kg, g, l, ml, pcs, pack, bottle, can, box)",
  "location": "Storage location (Pantry/Fridge/Freezer based on item type)",
  "category": "Category name (Vegetables/Fruits/Dairy/Meat & Seafood/Grains & Pasta/Pantry/Beverages/Snacks/Frozen Foods/Condiments)",
  "notes": "Price info or other details (optional)",
  "status": "Fresh"
}

Categories to use:
- Vegetables: Fresh and frozen vegetables  
- Fruits: Fresh and dried fruits
- Dairy: Milk, cheese, yogurt, eggs
- Meat & Seafood: Fresh and frozen proteins
- Grains & Pasta: Rice, bread, pasta, cereals
- Pantry: Canned goods, sauces, spices, dry goods
- Beverages: Drinks, juices, sodas
- Snacks: Chips, crackers, nuts
- Frozen Foods: Frozen meals and ice cream
- Condiments: Sauces, dressings, seasonings

Storage locations:
- Fridge: Dairy, fresh vegetables, fruits, meat
- Freezer: Frozen foods, ice cream
- Pantry: Dry goods, canned items, snacks, beverages

Rules:
1. Analyze the visual layout, tables, and formatting of the invoice
2. Extract ONLY food/grocery items (ignore taxes, delivery, services)
3. Clean item names: remove serial numbers, keep essential words
4. Standardize units: gm→g, ltr→l, nos→pcs, pc→pcs
5. Choose appropriate category and storage location based on item type
6. Set status as "Fresh" for all items
7. Include price in notes if available: "Bought for ₹X"
8. Use the visual structure to identify item rows vs header/footer text
9. Return empty array if no food items found

Respond with ONLY the JSON array, no other text.
`;

    // Convert buffer to base64 for Gemini
    const base64Data = pdfBuffer.toString('base64');
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "application/pdf"
        }
      }
    ]);
    
    const response = await result.response;
    const text = response.text();
    
    console.log('🤖 Gemini Vision raw response:', text.substring(0, 500));
    
    // Clean up the response to ensure it's valid JSON
    let cleanedText = text.trim();
    
    // Remove markdown code blocks if present
    cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    
    // Parse the JSON response
    const ingredients = JSON.parse(cleanedText);
    
    console.log('✅ Gemini Vision extracted ingredients:', ingredients.length);
    
    // Minimal validation - just ensure required fields exist
    const validatedIngredients = ingredients
      .filter((item: any) => item.name && item.name.length > 0)
      .map((item: any) => ({
        name: String(item.name).trim().substring(0, 150),
        brand: item.brand ? String(item.brand).trim().substring(0, 100) : null,
        quantity: Math.max(Number(item.quantity) || 1, 1),
        unit: item.unit ? String(item.unit).trim().substring(0, 50) : 'pcs',
        location: item.location ? String(item.location).trim().substring(0, 100) : 'Pantry',
        category: item.category ? String(item.category).trim() : null,
        notes: item.notes ? String(item.notes).trim() : null,
        status: 'Fresh'
      }));
    
    return validatedIngredients;
    
  } catch (error) {
    console.error('❌ Gemini Vision error:', error);
    throw new Error(`Failed to extract ingredients with Gemini Vision: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Fallback function for text-based analysis (when user pastes text)
async function extractIngredientsFromText(invoiceText: string) {
  try {
    console.log('🤖 Using Gemini AI to extract ingredients from text...');
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
You are an expert at analyzing grocery invoices and extracting ingredient information.

Please analyze the following invoice text and extract ALL food/grocery items in a structured JSON format.

Invoice Text:
"""
${invoiceText}
"""

Return a JSON array of ingredients with this EXACT structure:
{
  "name": "Clean item name (required, max 150 chars)",
  "brand": "Brand name if mentioned (max 100 chars, or null)",
  "quantity": number (integer, default 1),
  "unit": "Standard unit (max 50 chars: kg, g, l, ml, pcs, pack, bottle, can, box)",
  "location": "Storage location (Pantry/Fridge/Freezer based on item type)",
  "category": "Category name (Vegetables/Fruits/Dairy/Meat & Seafood/Grains & Pasta/Pantry/Beverages/Snacks/Frozen Foods/Condiments)",
  "notes": "Price info or other details (optional)",
  "status": "Fresh"
}

Categories: Vegetables, Fruits, Dairy, Meat & Seafood, Grains & Pasta, Pantry, Beverages, Snacks, Frozen Foods, Condiments
Storage: Fridge (dairy, fresh items), Freezer (frozen items), Pantry (dry goods)

Rules:
1. Extract ONLY food/grocery items (ignore taxes, delivery, services)
2. Clean item names and standardize units
3. Choose appropriate category and storage location
4. Include price in notes if available
5. Return empty array if no food items found

Respond with ONLY the JSON array, no other text.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('🤖 Gemini text analysis response:', text.substring(0, 500));
    
    // Clean up and parse JSON
    let cleanedText = text.trim();
    cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    
    const ingredients = JSON.parse(cleanedText);
    
    console.log('✅ Gemini text extracted ingredients:', ingredients.length);
    
    const validatedIngredients = ingredients
      .filter((item: any) => item.name && item.name.length > 0)
      .map((item: any) => ({
        name: String(item.name).trim().substring(0, 150),
        brand: item.brand ? String(item.brand).trim().substring(0, 100) : null,
        quantity: Math.max(Number(item.quantity) || 1, 1),
        unit: item.unit ? String(item.unit).trim().substring(0, 50) : 'pcs',
        location: item.location ? String(item.location).trim().substring(0, 100) : 'Pantry',
        category: item.category ? String(item.category).trim() : null,
        notes: item.notes ? String(item.notes).trim() : null,
        status: 'Fresh'
      }));
    
    return validatedIngredients;
    
  } catch (error) {
    console.error('❌ Gemini text analysis error:', error);
    throw new Error(`Failed to extract ingredients from text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}



export async function POST(req: NextRequest) {
  console.log('📄 Invoice upload API called');
  
  try {
    // Check for Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      console.log('❌ Gemini API key not configured');
      return NextResponse.json({ 
        error: "AI service not configured. Please contact administrator." 
      }, { status: 500 });
    }

    const { userId: clerkUserId } = auth();
    
    if (!clerkUserId) {
      console.log('❌ No user ID found in auth');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('✅ User authenticated:', clerkUserId);

    const dbUser = await getUserByClerkId(clerkUserId);
    if (!dbUser) {
      console.log('❌ User not found in database');
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    console.log('✅ Database user found:', dbUser.id);

    const contentType = req.headers.get('content-type') || '';
    console.log('📋 Content type:', contentType);
    
    if (contentType.includes('multipart/form-data')) {
      // Handle PDF file upload
      console.log('📤 Processing PDF upload...');
      
      try {
        const formData = await req.formData();
        const file = formData.get('pdfFile') as File;
        const kitchenId = formData.get('kitchenId') as string;
        
        console.log('📁 File details:', {
          name: file?.name,
          size: file?.size,
          type: file?.type,
          kitchenId
        });
        
        if (!file || !kitchenId) {
          console.log('❌ Missing file or kitchen ID');
          return NextResponse.json({ error: "PDF file and kitchen ID are required" }, { status: 400 });
        }

        if (file.type !== 'application/pdf') {
          console.log('❌ Invalid file type:', file.type);
          return NextResponse.json({ error: "Please upload a PDF file" }, { status: 400 });
        }

        if (file.size > 10 * 1024 * 1024) {
          console.log('❌ File too large:', file.size);
          return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 });
        }

        console.log('🔄 Converting file to buffer...');
        // Convert file to buffer
        const buffer = Buffer.from(await file.arrayBuffer());
        console.log('✅ Buffer created, size:', buffer.length);
        
        // Send PDF directly to Gemini Vision for analysis
        console.log('🤖 Sending PDF directly to Gemini Vision...');
        const parsedItems = await extractIngredientsFromPDF(buffer);
        console.log('✅ Gemini Vision parsed items count:', parsedItems.length);
        
        
        if (parsedItems.length === 0) {
          console.log('❌ No items found after Gemini Vision analysis');
          return NextResponse.json({ 
            error: "No items found in the invoice. Please check if it's a valid grocery invoice."
          }, { status: 400 });
        }

        console.log('✅ Items ready for review:', parsedItems.length);

        return NextResponse.json({ 
          success: true,
          itemsFound: parsedItems.length,
          items: parsedItems,
          message: `Successfully extracted ${parsedItems.length} items from PDF using AI Vision`
        }, { status: 200 });

      } catch (pdfError) {
        console.error('❌ PDF processing error:', pdfError);
        return NextResponse.json({ 
          error: "Failed to process PDF file. Please try again or use text input.",
          details: pdfError instanceof Error ? pdfError.message : 'Unknown PDF error'
        }, { status: 500 });
      }

    } else {
      // Handle text input (fallback)
      const body = await req.json();
      const { invoiceText, kitchenId } = body;

      if (!invoiceText || !kitchenId) {
        return NextResponse.json({ error: "Invoice text and kitchen ID are required" }, { status: 400 });
      }

      const parsedItems = await extractIngredientsFromText(invoiceText);
      
      if (parsedItems.length === 0) {
        return NextResponse.json({ 
          error: "No items found. Please check the format." 
        }, { status: 400 });
      }

      return NextResponse.json({ 
        success: true,
        itemsFound: parsedItems.length,
        items: parsedItems
      }, { status: 200 });
    }

  } catch (error) {
    console.error("❌ Global error processing invoice:", error);
    
    // More specific error messages
    if (error instanceof Error) {
      if (error.message.includes('payload')) {
        return NextResponse.json(
          { error: "File too large. Please try a smaller PDF or use text input." },
          { status: 413 }
        );
      }
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { error: "Request timeout. Please try again." },
          { status: 408 }
        );
      }
      if (error.message.includes('auth')) {
        return NextResponse.json(
          { error: "Authentication failed. Please refresh and try again." },
          { status: 401 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: "Failed to process invoice. Please try again.", 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Confirm and add items after user review
export async function PUT(req: NextRequest) {
  try {
    const { userId: clerkUserId } = auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { items, kitchenId } = body;

    if (!items || !Array.isArray(items) || !kitchenId) {
      return NextResponse.json({ error: "Items array and kitchen ID are required" }, { status: 400 });
    }

      // Get categories to map category names to IDs
  const categories = await getAllCategories();
  const addedItems = [];
  
  for (const item of items) {
    if (item.selected !== false) {
      try {
        // Find category ID by name
        let categoryId = null;
        if (item.category) {
          const category = categories.find(cat => cat.name === item.category);
          categoryId = category?.id || null;
        }

        const newItem = await createItem({
          kitchenId: parseInt(kitchenId),
          name: item.name,
          brand: item.brand || null,
          quantity: item.quantity || 1,
          unit: item.unit || 'pcs',
          categoryId,
          location: item.location || 'Pantry',
          status: item.status || 'Fresh',
          notes: item.notes || (item.price ? `Bought for ₹${item.price}` : 'Added from PDF invoice'),
        });
        addedItems.push(newItem);
      } catch (error) {
        console.error(`Error adding item ${item.name}:`, error);
      }
    }
  }

    return NextResponse.json({ 
      success: true,
      itemsAdded: addedItems.length,
      message: `Successfully added ${addedItems.length} items to your kitchen`
    }, { status: 201 });

  } catch (error) {
    console.error("Error adding items from invoice:", error);
    return NextResponse.json(
      { error: "Failed to add items. Please try again." },
      { status: 500 }
    );
  }
}

