import { auth, currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { 
  getUserByClerkId, 
  createUserIfNotExists,
  getDefaultKitchen, 
  getKitchensByUser,
  getItemsByKitchen, 
  getAllCategories,
  getKitchenStats 
} from "@/lib/db-utils";
import IngredientsView from "@/components/ingredients-view";

interface IngredientsPageProps {
  searchParams: { kitchenId?: string }
}

export default async function IngredientsPage({ searchParams }: IngredientsPageProps) {
  const { userId } = auth();
  const user = await currentUser();

  if (!userId) {
    redirect("/sign-in");
  }

  // Get user from our database, create if doesn't exist
  let dbUser = await getUserByClerkId(userId);
  
  if (!dbUser && user) {
    dbUser = await createUserIfNotExists({
      clerkId: userId,
      email: user.emailAddresses[0]?.emailAddress || "",
      firstName: user.firstName,
      lastName: user.lastName,
      profileImage: user.imageUrl,
    });
  }
  
  if (!dbUser) {
    redirect("/dashboard");
  }

  // Get kitchen to work with
  let targetKitchen = null;
  
  if (searchParams.kitchenId) {
    // Get specific kitchen by ID
    const kitchenId = parseInt(searchParams.kitchenId);
    const userKitchens = await getKitchensByUser(dbUser.id);
    targetKitchen = userKitchens.find(k => k.id === kitchenId) || null;
  }
  
  if (!targetKitchen) {
    // Fallback to default kitchen
    targetKitchen = await getDefaultKitchen(dbUser.id);
  }
  
  if (!targetKitchen) {
    redirect("/kitchen/setup");
  }

  // Get ingredients and categories
  const [ingredients, categories, stats] = await Promise.all([
    getItemsByKitchen(targetKitchen.id),
    getAllCategories(),
    getKitchenStats(targetKitchen.id)
  ]);

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Kitchen Ingredients</h1>
            <p className="text-muted-foreground">
              Managing {targetKitchen.name} • {stats.totalItems} total items
            </p>
          </div>
        </div>

        <IngredientsView 
          ingredients={ingredients}
          categories={categories}
          kitchenId={targetKitchen.id}
          stats={stats}
        />
      </div>
    </div>
  );
}
